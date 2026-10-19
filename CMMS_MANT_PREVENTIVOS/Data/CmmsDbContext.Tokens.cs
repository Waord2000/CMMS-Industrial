using CMMS_MANT_PREVENTIVOS.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace CMMS_MANT_PREVENTIVOS.Data;

public partial class CmmsDbContext
{
    public virtual DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
}