# Email Service Testing Guide

## 📧 Email Configuration

The MCP service now includes email functionality using Gmail SMTP.

### Configuration

Located in `mcp/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=gokulreena3@gmail.com
SMTP_PASSWORD=xuyn iifq spng kkgg
SMTP_FROM_EMAIL=gokulreena3@gmail.com
SMTP_FROM_NAME=TerraTruce MCP
```

## 🔍 Health Check

### Check Email Service Status

```bash
curl http://localhost:3001/api/mcp/email/health
```

**Expected Response:**

```json
{
  "email_service": {
    "configured": true,
    "smtp_host": "smtp.gmail.com",
    "smtp_port": "587",
    "from_email": "gokulreena3@gmail.com"
  }
}
```

## ✅ Test Email

### Send Test Email to Yourself

```bash
curl "http://localhost:3001/api/mcp/email/test"
```

This sends a test email to the configured SMTP_USERNAME (gokulreena3@gmail.com).

### Send Test Email to Specific Address

```bash
curl "http://localhost:3001/api/mcp/email/test?to=your-email@example.com"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Test email sent to your-email@example.com"
}
```

## 📨 Test Email Content

The test email includes:

- ✅ MCP Email Service Test header
- SMTP configuration details
- Timestamp
- Styled HTML template

## 🔧 Troubleshooting

### Email Not Sending

1. **Check Gmail App Password**

   - Ensure "xuyn iifq spng kkgg" is a valid Gmail App Password
   - Not your regular Gmail password

2. **Check 2FA**

   - Gmail requires 2-Factor Authentication enabled
   - App passwords only work with 2FA enabled

3. **Check Logs**

   ```bash
   docker-compose logs mcp | grep -i email
   ```

4. **Verify Configuration**
   ```bash
   curl http://localhost:3001/api/mcp/email/health
   ```

### Common Errors

**"Email service not configured"**

- Check that `.env` file exists in `mcp/` directory
- Verify SMTP_USERNAME and SMTP_PASSWORD are set

**"Authentication failed"**

- Verify Gmail App Password is correct
- Check that 2FA is enabled on Gmail account

**"Connection timeout"**

- Check firewall settings
- Verify port 587 is not blocked

## 🎯 Integration with Analysis

The email service can send analysis reports:

```rust
// In decision_engine.rs
if let Some(email_service) = &state.email_service {
    email_service.send_analysis_report(
        "user@example.com",
        "San Francisco, CA",
        &analysis_summary
    ).await?;
}
```

## 📊 Email Service Features

- ✅ HTML email templates
- ✅ Test email endpoint
- ✅ Health check endpoint
- ✅ Analysis report emails
- ✅ SMTP authentication
- ✅ Error handling
- ✅ Logging

## 🚀 Quick Test

```bash
# 1. Start MCP service
docker-compose up -d mcp

# 2. Check email health
curl http://localhost:3001/api/mcp/email/health

# 3. Send test email
curl "http://localhost:3001/api/mcp/email/test"

# 4. Check your inbox at gokulreena3@gmail.com
```

---

**Email service is ready for production use!** ✉️
