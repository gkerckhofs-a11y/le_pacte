"""Recette en navigateur. Dépendances locales : Node 24, Chromium, Playwright et Pillow."""
import argparse
from fnmatch import fnmatchcase
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
from threading import Thread
from urllib.parse import urlparse

from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SIZES = [(1280, 720), (1920, 1080), (2560, 1440), (3840, 2160)]


class Projection(SimpleHTTPRequestHandler):
    def __init__(self, *args, fixtures, **kwargs):
        self.fixtures = fixtures
        super().__init__(*args, directory=str(ROOT / 'public'), **kwargs)

    def log_message(self, *_):
        pass

    def do_GET(self):
        path = urlparse(self.path).path
        if not path.startswith('/api/founders/sessions/'):
            return super().do_GET()
        session = path.split('/')[-1]
        if len(session) != 24 or any(c not in 'abcdef0123456789' for c in session):
            return self.send_error(404)
        fixture = self.fixtures / (session + '.json')
        if not fixture.is_file():
            return self.send_error(404)
        data = fixture.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def check_image(page, selector, source):
    node = page.locator(selector)
    node.wait_for(state='visible')
    info = node.evaluate("""async el => {
        await el.decode();
        const b = el.getBoundingClientRect();
        return [el.getAttribute('src'), el.naturalWidth, el.naturalHeight, b.width, b.height, getComputedStyle(el).objectFit];
    }""")
    url, width, height, box_width, box_height, fit = info
    assert width > 0 and height > 0 and box_width > 100 and box_height > 80, (selector, info)
    assert source == url, (selector, source, url)
    assert fit == 'contain' or abs(box_width / box_height - width / height) < 0.02, (selector, info)
    return int(box_height)


def visible_inside(page, selector, w, h):
    box = page.locator(selector).bounding_box()
    assert box, selector
    assert box['x'] >= -1 and box['y'] >= -1, (selector, box)
    assert box['x'] + box['width'] <= w + 1 and box['y'] + box['height'] <= h + 1, (selector, box)
    return box


def inspect(page, case, view, w, h):
    phase = case['phase']
    page.wait_for_function("document.getElementById('connection').textContent === '● Synchronisé'", timeout=6000)
    assert not page.locator('#notice').inner_text().strip(), page.locator('#notice').inner_text()
    scroll = page.evaluate('''() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight]''')
    assert scroll[0] <= w + 1 and scroll[1] <= h + 1, (w, h, scroll)
    if phase in ('CHECKPOINT', 'EPILOGUE', 'FINISHED'):
        assert case['url'], ('Aucune vue projetable pour', case)
        height = check_image(page, '#cinemaImage', case['url'])
        if phase != 'FINISHED':
            visible_inside(page, '#cinemaTitle', w, h)
            visible_inside(page, '#cinemaGauges', w, h)
            scene = view['campaign']['cinema']
            for key, value in scene['city'].items():
                indicator = page.locator(f'#cinemaGauges [data-indicator="{key}"]')
                if key not in ('economie', 'ecologie', 'securite', 'bien_etre', 'demographie', 'stabilite'):
                    continue
                assert indicator.is_visible(), key
                if key in scene['changes']:
                    change = scene['changes'][key]
                    sign = 'plus' if change > 0 else 'minus' if change < 0 else 'equal'
                    assert indicator.locator(f'.cinema-delta[data-sign={sign}]').count() == 1, (key, change)
            assert not page.locator('#finalResults').is_visible()
        else:
            visible_inside(page, '#finalResults', w, h)
            visible_inside(page, '#winnerTitle', w, h)
            assert page.locator('#finalRanking li').count() >= len(view['families'])
        return height
    height = check_image(page, '#decisionImage', case['art'])
    art = visible_inside(page, '#decisionImage', w, h)
    copy = visible_inside(page, '#dilemmaPanel .projection-copy', w, h)
    assert art['x'] + art['width'] <= copy['x'] + 2, (art, copy)
    overflow = page.locator('#dilemmaPanel .projection-copy').evaluate('el => [el.scrollHeight-el.clientHeight, el.scrollWidth-el.clientWidth]')
    assert max(overflow) <= 2, ('Contenu de la narration rogné', overflow)
    assert not page.locator('#city').is_visible(), 'Ancien panorama visible'
    assert height >= h * 0.4, ('Illustration trop petite', w, h, height)
    for selector in ('#ballots', '#gauges', '#panoramaStability'):
        visible_inside(page, selector, w, h)
    if phase in ('NEGOTIATION', 'COUNCIL'):
        visible_inside(page, '#influenceReserve', w, h)
    if phase == 'COUNCIL':
        assert page.locator('#ballots [aria-current=true]').count() == 1
    if phase == 'REVEALED':
        visible_inside(page, '#outcome', w, h)
        assert page.locator('#gauges .gauge-delta').count() > 0
        assert case['opposite'] and not page.locator(f'img[src="{case["opposite"]}"]').count()
    else:
        assert page.locator('#gauges .gauge-delta').count() == 0
    return height


def test_missing_images(page, origin, case, view):
    scene = view['campaign']['cinema']
    source, fallback = scene['view']['url'], scene['fallback']['url']
    assert source != fallback
    url = origin + '/founders-city.html?session=' + case['session']
    page.route(origin + source, lambda route: route.abort())
    try:
        page.goto(url)
        page.wait_for_function("url => document.getElementById('cinemaImage').getAttribute('src') === url", arg=fallback)
        check_image(page, '#cinemaImage', fallback)
        page.route(origin + fallback, lambda route: route.abort())
        try:
            page.goto(url)
            page.locator('#cinemaMissing').wait_for(state='visible', timeout=5000)
            assert not page.locator('#cinemaImage').is_visible()
            assert page.locator('#cinemaTitle').is_visible() and page.locator('#cinemaGauges').is_visible()
        finally:
            page.unroute(origin + fallback)
    finally:
        page.unroute(origin + source)


def matrix(output):
    catalog = json.loads((ROOT / 'content/hotspring-cinema-v1.json').read_text())
    entries = {(v['stage'], v['cityProfile']): v for v in catalog['views'] if v.get('canonical')}
    cell_w, cell_h, gutter = 480, 270, 12
    sheet = Image.new('RGB', (4*cell_w+5*gutter, 6*(cell_h+40)+54), '#211a16')
    draw = ImageDraw.Draw(sheet)
    bold = ImageFont.truetype('DejaVuSans-Bold.ttf', 20)
    regular = ImageFont.truetype('DejaVuSans.ttf', 17)
    for i, t in enumerate(catalog['cityProfiles']):
        x = gutter + i*(cell_w+gutter)
        draw.text((x, 12), t['id']+' · '+t['title'], fill='#ffddb0', font=bold)
        for stage in range(1, 7):
            v = entries[stage, t['id']]
            y = 52 + (stage-1)*(cell_h+40)
            with Image.open(ROOT / 'public' / v['url'].lstrip('/')) as image:
                assert image.width * 9 == image.height * 16, (v['id'], image.size)
                sheet.paste(image.resize((cell_w, cell_h), Image.Resampling.LANCZOS), (x, y))
            draw.text((x, y + cell_h + 5), f"{'I II III IV V VI'.split()[stage-1]} · {catalog['stages'][str(stage)]}   /   {v['id']}", fill='white', font=regular)
    sheet.save(output / 'matrice-chapitres-profils.webp', quality=82, method=5)

    included = {v['url'] for v in entries.values()}
    groups = []
    links = ['# Galerie des vues cinématographiques', '',
             'Chaque lien ouvre le WebP livré à la projection. Une vue partagée a plusieurs identifiants dans le manifeste.', '']
    labels = {}
    for v in catalog['views']:
        labels.setdefault(v['url'], []).append(v['id'])
    for stage in range(8):
        section = catalog['stages'][str(stage)]
        if 1 <= stage <= 6:
            section = 'Chapitre ' + 'I II III IV V VI'.split()[stage-1] + ' · ' + section
        rows = [v for v in catalog['views'] if v['stage'] == stage]
        if not rows:
            continue
        links.extend(['## '+section, ''])
        special = []
        for v in rows:
            note = ' · secours' if v['fallback'] else ''
            links.append(f"- [{v['title']}](../../../../public{v['url']}) · `{v['id']}`{note}")
            if v['url'] not in included:
                included.add(v['url'])
                special.append(v)
        links.append('')
        if special:
            groups.append((section, special))
    (output / 'galerie.md').write_text('\n'.join(links), encoding='utf-8')
    header, row_h = 53, cell_h + 54
    gallery_h = sum(header + (len(rows)+3)//4*row_h for _, rows in groups) + gutter
    gallery = Image.new('RGB', (4*cell_w+5*gutter, gallery_h), '#211a16')
    draw = ImageDraw.Draw(gallery)
    y = gutter
    for section, rows in groups:
        draw.text((gutter, y+5), section, fill='#ffddb0', font=bold)
        y += header
        for i, v in enumerate(rows):
            x, top = gutter+(i%4)*(cell_w+gutter), y+(i//4)*row_h
            with Image.open(ROOT / 'public' / v['url'].lstrip('/')) as image:
                assert image.width * 9 == image.height * 16, (v['id'], image.size)
                gallery.paste(image.resize((cell_w, cell_h), Image.Resampling.LANCZOS), (x, top))
            draw.text((x, top+cell_h+4), v['title'], fill='white', font=regular)
            ids = ', '.join(labels[v['url']])
            draw.text((x, top+cell_h+25), ids + (' · secours' if v['fallback'] else ''), fill='#e9cfaa', font=regular)
        y += (len(rows)+3)//4*row_h
    gallery.save(output / 'galerie-variantes.webp', quality=82, method=5)



def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, help='Dossier des captures et du relevé JSON')
    parser.add_argument('--case', help='Filtrer par parcours/étape, par exemple industrie/dilemme ou */epilogue')
    parser.add_argument('--matrix', action='store_true', help='Produire les deux planches et l’index des images')
    args = parser.parse_args()
    output = args.output.resolve() if args.output else None
    if output:
        output.mkdir(parents=True, exist_ok=True)
    if args.matrix:
        if output is None:
            parser.error('--matrix nécessite --output')
        matrix(output)
        return
    records = []
    with tempfile.TemporaryDirectory() as folder, sync_playwright() as pw:
        fixtures = Path(folder)
        subprocess.run(['node', 'scripts/capture-hotspring-cinema.mjs', str(fixtures)], cwd=ROOT, check=True)
        index = json.loads((fixtures / 'index.json').read_text())
        if args.case:
            index = [c for c in index if fnmatchcase(c['route'] + '/' + c['stage'], args.case)]
            if not index:
                parser.error('Parcours/étape introuvable')
        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Projection, fixtures=fixtures))
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        origin = 'http://127.0.0.1:' + str(server.server_port)
        chrome = os.environ.get('CHROMIUM') or shutil.which('chromium')
        browser = pw.chromium.launch(executable_path=chrome, args=['--no-sandbox', '--disable-dev-shm-usage'])
        try:
            page = browser.new_page(reduced_motion='reduce', device_scale_factor=1, locale='fr-BE')
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            for w, h in SIZES:
                page.set_viewport_size({'width': w, 'height': h})
                for case in index:
                    name = case['route'] + '-' + case['stage']
                    view = json.loads((fixtures / (case['session'] + '.json')).read_text())
                    try:
                        page.goto(origin + '/founders-city.html?session=' + case['session'])
                        height = inspect(page, case, view, w, h)
                        if case['stage'] in ('epilogue', 'conseil') and w in (1920, 3840):
                            button = page.locator('#projectionFullscreen')
                            tools = page.locator('#cinemaTools')
                            open_controls = not button.is_visible()
                            if open_controls:
                                tools.click()
                            button.click()
                            page.wait_for_function('Boolean(document.fullscreenElement)')
                            button.click()
                            page.wait_for_function('!document.fullscreenElement')
                            if open_controls:
                                tools.click()
                        if case['stage'] == 'conseil' and w == 1920:
                            page.locator('#panoramaOverview').click()
                            page.locator('#valleyDialog[open]').wait_for(state='visible')
                            page.locator('#valleyDialog button').click()
                            assert not page.locator('#valleyDialog').is_visible()
                        assert not errors, errors
                    except Exception as e:
                        if output:
                            page.screenshot(path=str(output / 'echec.png'))
                        raise RuntimeError(f'{name} {w}×{h}: {e}') from e
                    record = {'parcours': case['route'], 'étape': case['stage'], 'phase': case['phase'],
                              'résolution': f'{w}×{h}', 'hauteurImage': height}
                    if output and case['capture'] and w in (1920, 3840):
                        path = output / f'{name}-{w}x{h}.webp'
                        image = Image.open(io.BytesIO(page.screenshot())).convert('RGB')
                        assert image.size == (w, h)
                        image.save(path, quality=77 if w == 1920 else 69, method=5)
                        record['capture'] = path.name
                    records.append(record)
            for w, h in SIZES:
                ordinary = [r['hauteurImage'] for r in records if r['étape'].startswith('presentation-c') and r['résolution'] == f'{w}×{h}']
                assert not ordinary or max(ordinary) - min(ordinary) <= 2, ('Illustration redimensionnée suivant le chapitre', w, h, ordinary)
            if not args.case:
                example = next(c for c in index if c['route'] == 'industrie' and c['stage'] == 'chapitre-4')
                view = json.loads((fixtures / (example['session'] + '.json')).read_text())
                test_missing_images(page, origin, example, view)
                print('Pannes simulées : vue principale, puis principale et secours. Bilans disponibles dans les deux cas.')
            print(f'{len(records)} projections vérifiées. {sum("capture" in r for r in records)} captures.')
            if output:
                (output / 'releve.json').write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
        finally:
            browser.close()
            server.shutdown()
            server.server_close()
            thread.join()


if __name__ == '__main__':
    main()
