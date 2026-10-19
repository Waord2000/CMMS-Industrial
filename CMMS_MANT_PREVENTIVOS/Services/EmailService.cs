using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace CMMS_MANT_PREVENTIVOS.Services;

public interface IEmailService
{
    Task EnviarAsync(string destino, string asunto, string cuerpoHtml);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task EnviarAsync(string destino, string asunto, string cuerpoHtml)
    {
        var remitente = _config["Email:From"] ?? "no-reply@cmms.local";
        var nombreRemitente = _config["Email:FromName"] ?? "CMMS";
        var host = _config["Email:Host"] ?? "localhost";
        var puerto = int.Parse(_config["Email:Port"] ?? "25");
        var usarSsl = bool.Parse(_config["Email:UseSsl"] ?? "false");

        var mensaje = new MimeMessage();
        mensaje.From.Add(new MailboxAddress(nombreRemitente, remitente));
        mensaje.To.Add(MailboxAddress.Parse(destino));
        mensaje.Subject = asunto;
        mensaje.Body = new BodyBuilder { HtmlBody = cuerpoHtml }.ToMessageBody();

        using var smtp = new SmtpClient();
        await smtp.ConnectAsync(
            host,
            puerto,
            usarSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None);

        var usuario = _config["Email:User"];
        if (!string.IsNullOrEmpty(usuario))
            await smtp.AuthenticateAsync(usuario, _config["Email:Password"] ?? string.Empty);

        await smtp.SendAsync(mensaje);
        await smtp.DisconnectAsync(true);
    }
}