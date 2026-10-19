using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CMMS_MANT_PREVENTIVOS.Data.Models;

[Table("PasswordResetTokens")]
public class PasswordResetToken
{
    [Key]
    public int TokenId { get; set; }
    public int UsuarioId { get; set; }
    public byte[] TokenHash { get; set; } = null!;
    public DateTime Expira { get; set; }
    public bool Usado { get; set; }
    public DateTime FechaCreacion { get; set; }
}