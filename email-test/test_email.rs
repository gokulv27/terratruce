use lettre::{
    message::header::ContentType,
    transport::smtp::authentication::Credentials,
    Message, SmtpTransport, Transport,
};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🧪 Testing Email Service...\n");

    // SMTP Configuration
    let smtp_host = "smtp.gmail.com";
    let smtp_port = 587;
    let smtp_username = "gokulreena3@gmail.com";
    let smtp_password = "xuyn iifq spng kkgg";
    let from_email = "gokulreena3@gmail.com";
    let from_name = "TerraTruce MCP";
    let to_email = "gokulreena3@gmail.com";

    println!("📧 Configuration:");
    println!("  SMTP Host: {}", smtp_host);
    println!("  SMTP Port: {}", smtp_port);
    println!("  From: {} <{}>", from_name, from_email);
    println!("  To: {}\n", to_email);

    // Create email
    let email = Message::builder()
        .from(format!("{} <{}>", from_name, from_email).parse()?)
        .to(to_email.parse()?)
        .subject("✅ MCP Email Service Test - SUCCESS!")
        .header(ContentType::TEXT_HTML)
        .body(format!(
            r#"
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #F9FAFB;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #10B981; margin-bottom: 20px;">✅ Email Service Test SUCCESSFUL!</h2>
                    <p style="font-size: 16px; color: #374151;">
                        This is a test email from the TerraTruce MCP service.
                    </p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #E5E7EB;">
                    <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #1F2937; margin-top: 0;">SMTP Configuration</h3>
                        <ul style="color: #4B5563;">
                            <li><strong>Host:</strong> {}</li>
                            <li><strong>Port:</strong> {}</li>
                            <li><strong>From:</strong> {} &lt;{}&gt;</li>
                            <li><strong>Authentication:</strong> ✓ Enabled</li>
                        </ul>
                    </div>
                    <p style="color: #10B981; font-weight: bold; font-size: 18px;">
                        ✓ Email service is working correctly!
                    </p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #E5E7EB;">
                    <p style="color: #9CA3AF; font-size: 12px;">
                        Sent from TerraTruce Model Control Proxy<br>
                        Time: {}<br>
                        Test ID: email-test-001
                    </p>
                </div>
            </body>
            </html>
            "#,
            smtp_host,
            smtp_port,
            from_name,
            from_email,
            chrono::Utc::now().to_rfc3339()
        ))?;

    println!("📤 Sending email...");

    // Create SMTP transport
    let creds = Credentials::new(smtp_username.to_string(), smtp_password.to_string());

    let mailer = SmtpTransport::relay(smtp_host)?
        .port(smtp_port)
        .credentials(creds)
        .build();

    // Send email
    match mailer.send(&email) {
        Ok(_) => {
            println!("✅ Email sent successfully!");
            println!("\n🎉 SUCCESS! Check your inbox at {}", to_email);
            println!("\nThe email should arrive within a few seconds.");
            Ok(())
        }
        Err(e) => {
            println!("❌ Failed to send email: {}", e);
            Err(Box::new(e))
        }
    }
}
