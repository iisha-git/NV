#!/usr/bin/env bash
# NyayVivek demo deployment to Azure Container Apps (student subscription).
# REVIEW BEFORE RUNNING. Creates billable-capable resources (backstopped by
# the $100 student credit; design target is $0 within monthly free grants).
# Prereqs: az CLI logged in (az login), correct subscription selected
# (az account show), demo images already built and public on GHCR
# (push the demo-local-backend branch; the GitHub Action builds them).
set -euo pipefail

RG=nyayvivek-demo-rg
LOC=centralindia          # fallback: southeastasia if quota/region fails
ENV=nyayvivek-demo-env
STOR=nyayvivekstor$RANDOM
SHARE=uploads
WEB=nyayvivek-web
ML=nyayvivek-ml
IMG_WEB=ghcr.io/iisha-git/nv-web:demo
IMG_ML=ghcr.io/iisha-git/nv-ml:demo

# --- FILL THESE (new values only; never reuse old/shared secrets) ---
: "${MONGO_URI:?set MONGO_URI to a FRESH Atlas M0 connection string}"
: "${JWT_SECRET:?set a new random value}"
: "${ACCESS_TOKEN_SECRET:?set a new random value}"
: "${REFRESH_TOKEN_SECRET:?set a new random value}"

az group create -n "$RG" -l "$LOC" -o none

# Persistent uploads (Azure Files, pay-as-you-go)
az storage account create -n "$STOR" -g "$RG" -l "$LOC" --sku Standard_LRS --kind StorageV2 -o none
STOR_KEY=$(az storage account keys list -n "$STOR" -g "$RG" --query "[0].value" -o tsv)
az storage share create -n "$SHARE" --account-name "$STOR" --account-key "$STOR_KEY" -o none

az containerapp env create -n "$ENV" -g "$RG" -l "$LOC" --logs-destination none -o none
az containerapp env storage set -n "$ENV" -g "$RG" --storage-name uploads \
  --azure-file-account-name "$STOR" --azure-file-account-key "$STOR_KEY" \
  --azure-file-share-name "$SHARE" --access-mode ReadWrite -o none

# ML service: internal only, 2GiB, scale 0-1
az containerapp create -n "$ML" -g "$RG" --environment "$ENV" --image "$IMG_ML" \
  --ingress internal --target-port 8000 --transport http \
  --cpu 1 --memory 2Gi --min-replicas 0 --max-replicas 1 -o none
ML_FQDN=$(az containerapp show -n "$ML" -g "$RG" --query properties.configuration.ingress.fqdn -o tsv)

# Web app: public HTTPS, serves client + API, uploads volume mounted at /app/server/uploads
az containerapp create -n "$WEB" -g "$RG" --environment "$ENV" --image "$IMG_WEB" \
  --ingress external --target-port 5000 --transport http \
  --cpu 0.25 --memory 0.5Gi --min-replicas 0 --max-replicas 2 \
  --secrets mongo-uri="$MONGO_URI" jwt-secret="$JWT_SECRET" \
            access-token-secret="$ACCESS_TOKEN_SECRET" refresh-token-secret="$REFRESH_TOKEN_SECRET" \
  --env-vars PORT=5000 MONGO_URI=secretref:mongo-uri JWT_SECRET=secretref:jwt-secret \
            ACCESS_TOKEN_SECRET=secretref:access-token-secret REFRESH_TOKEN_SECRET=secretref:refresh-token-secret \
            CLIENT_URL=same-origin ML_SERVICE_URL="https://$ML_FQDN" -o none

az containerapp show -n "$WEB" -g "$RG" --query properties.configuration.ingress.fqdn -o tsv
echo "Public URL above. Attach the uploads volume to $WEB (volume mount) via:"
echo "  az containerapp update -n $WEB -g $RG --yaml web-volume.yaml"
echo "TODO before demo: mount volume, upload a test PDF, verify dossier persists across a restart."
