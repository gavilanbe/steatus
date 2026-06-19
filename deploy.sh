#!/bin/bash

# Google Cloud deployment script for Steatus
# Usage: ./deploy.sh PROJECT_ID

set -e

PROJECT_ID=$1
if [ -z "$PROJECT_ID" ]; then
  echo "Usage: ./deploy.sh PROJECT_ID"
  exit 1
fi

echo "🚀 Deploying Steatus to Google Cloud Run..."
echo "Project ID: $PROJECT_ID"

# Set project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📡 Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable sql-admin.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Create database instance if it doesn't exist
echo "🗄️  Setting up Cloud SQL database..."
if ! gcloud sql instances describe steatus-db &>/dev/null; then
  gcloud sql instances create steatus-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --storage-type=SSD \
    --storage-size=10GB \
    --backup \
    --maintenance-release-channel=production \
    --maintenance-window-day=SUN \
    --maintenance-window-hour=06 \
    --deletion-protection
fi

# Create database
gcloud sql databases create steatus --instance=steatus-db || true

# Create database user
DB_PASSWORD=$(openssl rand -base64 32)
gcloud sql users create steatus-user --instance=steatus-db --password=$DB_PASSWORD || true

# Store database URL as secret
CONNECTION_NAME=$(gcloud sql instances describe steatus-db --format="value(connectionName)")
DATABASE_URL="postgresql://steatus-user:$DB_PASSWORD@localhost/steatus?host=/cloudsql/$CONNECTION_NAME"

echo "🔐 Creating secrets..."
echo -n "$DATABASE_URL" | gcloud secrets create database-url --data-file=- || \
  echo -n "$DATABASE_URL" | gcloud secrets versions add database-url --data-file=-

# Create JWT secret
JWT_SECRET=$(openssl rand -base64 64)
echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=- || \
  echo -n "$JWT_SECRET" | gcloud secrets versions add jwt-secret --data-file=-

# Build and deploy backend
echo "🏗️  Building and deploying backend..."
cd server
gcloud builds submit --tag gcr.io/$PROJECT_ID/steatus-api:latest
cd ..

# Deploy backend service
gcloud run deploy steatus-api \
  --image gcr.io/$PROJECT_ID/steatus-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production,PORT=3001 \
  --set-secrets DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest \
  --add-cloudsql-instances $CONNECTION_NAME

# Get backend URL
BACKEND_URL=$(gcloud run services describe steatus-api --region=us-central1 --format="value(status.url)")
echo "Backend deployed at: $BACKEND_URL"

# Build and deploy frontend
echo "🎨 Building and deploying frontend..."
# Set environment variable for build
export VITE_API_URL="$BACKEND_URL/api"

# Create build-time environment file
echo "VITE_API_URL=$BACKEND_URL/api" > .env.production

gcloud builds submit --tag gcr.io/$PROJECT_ID/steatus-frontend:latest

# Deploy frontend service
gcloud run deploy steatus-frontend \
  --image gcr.io/$PROJECT_ID/steatus-frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 80 \
  --memory 256Mi \
  --cpu 0.5 \
  --min-instances 1 \
  --max-instances 5

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe steatus-frontend --region=us-central1 --format="value(status.url)")

# Update backend with frontend URL
gcloud run services update steatus-api \
  --region us-central1 \
  --set-env-vars NODE_ENV=production,PORT=3001,FRONTEND_URL=$FRONTEND_URL

echo "✅ Deployment complete!"
echo "Frontend: $FRONTEND_URL"
echo "Backend: $BACKEND_URL"
echo ""
echo "🔧 Next steps:"
echo "1. Run database migrations: gcloud run jobs create steatus-migrate --image gcr.io/$PROJECT_ID/steatus-api:latest --task-timeout 600 --region us-central1"
echo "2. Configure custom domain if needed"
echo "3. Set up monitoring and alerts"