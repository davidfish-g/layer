# Google Cloud SQL Setup Guide

## Prerequisites

1. **Install Google Cloud CLI**

via Homebrew
   brew install google-cloud-sdk //already done
   ```

2. **Initialize and authenticate**
   ```bash
   gcloud init
   gcloud auth login
   gcloud config set project layerid
   ```

## Step 1: Enable Required APIs

```bash
# Enable Cloud SQL Admin API
gcloud services enable sqladmin.googleapis.com

# Enable Cloud SQL Proxy (for secure connections)
gcloud services enable sql-component.googleapis.com
```

## Step 2: Create Cloud SQL Instance

```bash
# Create PostgreSQL instance
gcloud sql instances create layer-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-size=20GB \
  --storage-type=SSD \
  --storage-auto-increase \
  --backup-start-time=02:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=03 \
  --deletion-protection
```

**Instance Details:**
- **Instance ID**: `layer-db`
- **Region**: `us-central1` (or change to your preferred region)
- **Machine Type**: `db-f1-micro` (suitable for development/testing)
- **Storage**: 20GB SSD with auto-increase enabled
- **Backups**: Daily at 2:00 AM
- **Maintenance**: Sundays at 3:00 AM

## Step 3: Set Database Password

```bash
# Set password for the postgres user
gcloud sql users set-password postgres \
  --instance=layer-db \
  --password='YOUR_SECURE_PASSWORD'
```

## Step 4: Create Application Database

```bash
# Create the application database
gcloud sql databases create layer --instance=layer-db
```

## Step 5: Configure Network Access

### Option A: Public IP (for development)
```bash
# Get your current IP address
curl ifconfig.me

# Allow your IP to connect (replace with your actual IP)
gcloud sql instances patch layer-db \
  --authorized-networks=YOUR_IP_ADDRESS/32
```

### Option B: Private IP (recommended for production)
```bash
# Enable private services access (one-time setup)
gcloud compute addresses create google-managed-services-default \
  --global \
  --purpose=VPC_PEERING \
  --prefix-length=16 \
  --network=default

gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges=google-managed-services-default \
  --network=default

# Create instance with private IP
gcloud sql instances patch layer-db \
  --network=default \
  --no-assign-ip
```

## Step 6: Get Connection Information

```bash
# Get instance connection name
gcloud sql instances describe layer-db --format="value(connectionName)"

# Get public IP (if using public IP)
gcloud sql instances describe layer-db --format="value(ipAddresses[0].ipAddress)"

# Get private IP (if using private IP)
gcloud sql instances describe layer-db --format="value(ipAddresses[1].ipAddress)"
```

## Step 7: Update Environment Variables

Update your `.env` file with the actual values:

```env
# Example for public IP connection
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@34.123.45.67:5432/layer"

# Example for private IP connection
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@10.1.2.3:5432/layer"

# Cloud SQL connection string (for Cloud SQL Proxy)
CLOUD_SQL_CONNECTION_STRING="layerid:us-central1:layer-db"
```

## Step 8: Test Connection

### Using Cloud SQL Proxy (Recommended)
```bash
# Download and install Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.amd64
chmod +x cloud-sql-proxy

# Start proxy (in a separate terminal)
./cloud-sql-proxy layerid:us-central1:layer-db

# Connect via proxy (in another terminal)
psql "host=127.0.0.1 port=5432 sslmode=disable dbname=layer user=postgres"
```

### Direct Connection (if using public IP)
```bash
psql "host=YOUR_INSTANCE_IP port=5432 sslmode=require dbname=layer user=postgres"
```

## Step 9: Initialize Database Schema

```bash
# Run Prisma migrations
npm run db:migrate
# or
npx prisma migrate deploy
```

## Production Considerations

1. **Security**:
   - Use private IP instead of public IP
   - Enable SSL/TLS enforcement
   - Use IAM database authentication
   - Restrict authorized networks

2. **Performance**:
   - Upgrade to higher tier machines (db-standard-1, db-standard-2, etc.)
   - Enable read replicas for read-heavy workloads
   - Configure connection pooling

3. **Backup & Recovery**:
   - Enable point-in-time recovery
   - Configure backup retention period
   - Test restore procedures

4. **Monitoring**:
   - Set up Cloud Monitoring alerts
   - Enable query insights
   - Monitor performance metrics

## Troubleshooting

### Connection Issues
```bash
# Check instance status
gcloud sql instances describe layer-db

# Check authorized networks
gcloud sql instances describe layer-db --format="value(settings.ipConfiguration.authorizedNetworks[])"

# View recent operations
gcloud sql operations list --instance=layer-db
```

### Common Commands
```bash
# Stop instance (to save costs during development)
gcloud sql instances stop layer-db

# Start instance
gcloud sql instances start layer-db

# Delete instance (careful!)
gcloud sql instances delete layer-db
```

## Cost Optimization

For development:
- Use `db-f1-micro` or `db-g1-small` tiers
- Stop instances when not in use
- Enable automatic storage increases instead of over-provisioning

For production:
- Use committed use discounts
- Monitor and right-size instances
- Use read replicas only when needed

## Next Steps

1. Set up your Cloud SQL instance using the commands above
2. Update your `.env` file with the actual connection details
3. Run your Prisma migrations to set up the database schema
4. Test the connection from your Next.js application 