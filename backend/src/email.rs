use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, AsyncSmtpTransport, Tokio1Executor, AsyncTransport};
use std::env;
use tracing::{info, error};

pub async fn send_email(to: &str, subject: &str, body: &str) -> Result<(), String> {
    let smtp_username = env::var("SMTP_USERNAME").map_err(|_| "SMTP_USERNAME not set".to_string())?;
    let smtp_password = env::var("SMTP_PASSWORD").map_err(|_| "SMTP_PASSWORD not set".to_string())?;
    let smtp_host = env::var("SMTP_HOST").unwrap_or_else(|_| "smtp.gmail.com".to_string());
    // let smtp_port = env::var("SMTP_PORT").unwrap_or_else(|_| "587".to_string()).parse::<u16>().unwrap_or(587);

    // Create email
    let email = Message::builder()
        .from(smtp_username.parse().map_err(|_| "Invalid sender email".to_string())?)
        .to(to.parse().map_err(|_| "Invalid recipient email".to_string())?)
        .subject(subject)
        .header(lettre::message::header::ContentType::TEXT_PLAIN)
        .body(body.to_string())
        .map_err(|e| e.to_string())?;

    let creds = Credentials::new(smtp_username, smtp_password);

    // Open connection
    // Note: relay() usually infers port 587 and STARTTLS for gmail.com
    let mailer: AsyncSmtpTransport<Tokio1Executor> = AsyncSmtpTransport::<Tokio1Executor>::relay(&smtp_host)
        .map_err(|e| e.to_string())?
        .credentials(creds)
        .build();

    // Send the email
    match mailer.send(email).await {
        Ok(_) => {
            info!("Email sent successfully to {}", to);
            Ok(())
        },
        Err(e) => {
            error!("Could not send email: {:?}", e);
            Err(format!("Could not send email: {:?}", e))
        },
    }
}
