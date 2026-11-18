#!/usr/bin/env bash
# Run once from an administrator's Cloud Shell. This configures IAM only.
set -euo pipefail

project=le-pacte-ludificateur
project_number=48298108779
region=europe-west1
pool=pacte-github
provider=pacte-release
account=pacte-github-deploy
email="$account@$project.iam.gserviceaccount.com"
member="serviceAccount:$email"
account_subject="principalSet://iam.googleapis.com/projects/$project_number/locations/global/workloadIdentityPools/$pool/attribute.repository_id/1443026566"
condition="assertion.repository_owner_id == '331737602' && assertion.repository_id == '1443026566' && assertion.ref == 'refs/heads/deploy/firebase' && assertion.event_name == 'push' && assertion.workflow_ref == 'gkerckhofs-a11y/le_pacte/.github/workflows/publish-firebase.yml@refs/heads/deploy/firebase'"
mapping='google.subject=assertion.sub,attribute.repository_id=assertion.repository_id'

actual_number=$(gcloud projects describe "$project" --format='value(projectNumber)')
if [[ "$actual_number" != "$project_number" ]]; then
  echo 'Numéro de projet inattendu. Aucune modification effectuée.' >&2
  exit 1
fi

declare -A function_accounts=()
declare -a run_services=()
for function in api tick; do
  runtime_account=$(gcloud functions describe "$function" --gen2 --region="$region" --project="$project" --format='value(serviceConfig.serviceAccountEmail)')
  build_account=$(gcloud functions describe "$function" --gen2 --region="$region" --project="$project" --format='value(buildConfig.serviceAccount)')
  run_service=$(gcloud functions describe "$function" --gen2 --region="$region" --project="$project" --format='value(serviceConfig.service)')
  if [[ -z "$runtime_account" || -z "$run_service" ]]; then
    echo "Compte ou service Cloud Run introuvable pour $function." >&2
    exit 1
  fi
  function_accounts["$runtime_account"]=1
  run_services+=("${run_service##*/}")
  if [[ -n "$build_account" ]]; then function_accounts["${build_account##*/}"]=1; fi
done
if iam_build_account=$(gcloud builds get-default-service-account --region="$region" --project="$project" --format='value(serviceAccountEmail)'); then
  # The command may return a fully qualified service account resource.
  iam_build_account=${iam_build_account##*/}
  if [[ "$iam_build_account" == *@* && "$iam_build_account" != *$'\n'* ]]; then
    function_accounts["$iam_build_account"]=1
  fi
fi
# Firebase CLI checks the App Engine account when it exists in the project.
app_engine_account="$project@appspot.gserviceaccount.com"
if gcloud iam service-accounts describe "$app_engine_account" --project="$project" --quiet >/dev/null 2>&1; then
  function_accounts["$app_engine_account"]=1
fi

gcloud services enable iamcredentials.googleapis.com sts.googleapis.com --project="$project"
if ! gcloud iam service-accounts describe "$email" --project="$project" --quiet >/dev/null 2>&1; then
  gcloud iam service-accounts create "$account" --project="$project" --display-name='Publication Firebase du Pacte'
fi
if ! gcloud iam workload-identity-pools describe "$pool" --location=global --project="$project" --quiet >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "$pool" --location=global --project="$project" --display-name='GitHub Actions du Pacte'
fi
if gcloud iam workload-identity-pools providers describe "$provider" --workload-identity-pool="$pool" --location=global --project="$project" --quiet >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers update-oidc "$provider" --workload-identity-pool="$pool" --location=global --project="$project" \
    --issuer-uri=https://token.actions.githubusercontent.com --attribute-mapping="$mapping" --attribute-condition="$condition"
else
  gcloud iam workload-identity-pools providers create-oidc "$provider" --workload-identity-pool="$pool" --location=global --project="$project" \
    --issuer-uri=https://token.actions.githubusercontent.com --attribute-mapping="$mapping" --attribute-condition="$condition" --display-name='Branche de publication du Pacte'
fi

gcloud iam service-accounts add-iam-policy-binding "$email" --project="$project" \
  --member="$account_subject" --role=roles/iam.workloadIdentityUser --condition=None

for role in roles/firebasehosting.admin roles/cloudfunctions.admin roles/cloudscheduler.admin roles/serviceusage.apiKeysViewer roles/serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding "$project" --member="$member" --role="$role" --condition=None --quiet
done
for function_account in "${!function_accounts[@]}"; do
  gcloud iam service-accounts add-iam-policy-binding "$function_account" --project="$project" \
    --member="$member" --role=roles/iam.serviceAccountUser --condition=None --quiet
done
for run_service in "${run_services[@]}"; do
  gcloud run services add-iam-policy-binding "$run_service" --region="$region" --project="$project" \
    --member="$member" --role=roles/run.admin --quiet
done
echo 'Liaison GitHub–Firebase prête.'
