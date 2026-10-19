using System;
using System.Collections.Generic;
using CMMS_MANT_PREVENTIVOS.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace CMMS_MANT_PREVENTIVOS.Data;

public partial class CmmsDbContext : DbContext

{
    public CmmsDbContext()
    {
    }

    public CmmsDbContext(DbContextOptions<CmmsDbContext> options)
        : base(options)
    {
    }
    public virtual DbSet<Area> Areas { get; set; }

    public virtual DbSet<CategoriasRepuesto> CategoriasRepuestos { get; set; }

    public virtual DbSet<ConsumoRepuesto> ConsumoRepuestos { get; set; }

    public virtual DbSet<Maquina> Maquinas { get; set; }

    public virtual DbSet<MovimientosInventario> MovimientosInventarios { get; set; }

    public virtual DbSet<OrdenesTrabajo> OrdenesTrabajos { get; set; }

    public virtual DbSet<ParosMaquina> ParosMaquinas { get; set; }

    public virtual DbSet<PlanesMantenimiento> PlanesMantenimientos { get; set; }

    public virtual DbSet<Repuesto> Repuestos { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<TareasPlan> TareasPlans { get; set; }

    public virtual DbSet<TiposMantenimiento> TiposMantenimientos { get; set; }

    public virtual DbSet<Usuario> Usuarios { get; set; }

    public virtual DbSet<VwConsumoRepuesto> VwConsumoRepuestos { get; set; }

    public virtual DbSet<VwMtbf> VwMtbfs { get; set; }

    public virtual DbSet<VwMttr> VwMttrs { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseSqlServer("Name=ConnectionStrings:CmmsConnection");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Area>(entity =>
        {
            entity.HasKey(e => e.AreaId).HasName("PK__Areas__70B8202863EA3D0F");

            entity.HasIndex(e => e.NombreArea, "UQ__Areas__D5E8EEB5B4A76178").IsUnique();

            entity.Property(e => e.AreaId).HasColumnName("AreaID");
            entity.Property(e => e.NombreArea)
                .HasMaxLength(100)
                .IsUnicode(false);
        });

        modelBuilder.Entity<CategoriasRepuesto>(entity =>
        {
            entity.HasKey(e => e.CategoriaId).HasName("PK__Categori__F353C1C5BE156BA1");

            entity.HasIndex(e => e.NombreCategoria, "UQ__Categori__A21FBE9F060C9E5A").IsUnique();

            entity.Property(e => e.CategoriaId).HasColumnName("CategoriaID");
            entity.Property(e => e.NombreCategoria)
                .HasMaxLength(80)
                .IsUnicode(false);
        });

        modelBuilder.Entity<ConsumoRepuesto>(entity =>
        {
            entity.HasKey(e => e.ConsumoId).HasName("PK__ConsumoR__206D9CC6462EA8BE");

            entity.HasIndex(e => e.OrdenId, "IX_Consumo_Orden");

            entity.Property(e => e.ConsumoId).HasColumnName("ConsumoID");
            entity.Property(e => e.Cantidad).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.FechaConsumo).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.OrdenId).HasColumnName("OrdenID");
            entity.Property(e => e.RepuestoId).HasColumnName("RepuestoID");

            entity.HasOne(d => d.Orden).WithMany(p => p.ConsumoRepuestos)
                .HasForeignKey(d => d.OrdenId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Consumo_Ordenes");

            entity.HasOne(d => d.Repuesto).WithMany(p => p.ConsumoRepuestos)
                .HasForeignKey(d => d.RepuestoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Consumo_Repuestos");
        });

        modelBuilder.Entity<Maquina>(entity =>
        {
            entity.HasKey(e => e.MaquinaId).HasName("PK__Maquinas__5D47B8B5738ED6C0");

            entity.Property(e => e.MaquinaId).HasColumnName("MaquinaID");
            entity.Property(e => e.AreaId).HasColumnName("AreaID");
            entity.Property(e => e.Estado)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("Operativa");
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Marca)
                .HasMaxLength(80)
                .IsUnicode(false);
            entity.Property(e => e.Nombre)
                .HasMaxLength(120)
                .IsUnicode(false);

            entity.HasOne(d => d.Area).WithMany(p => p.Maquinas)
                .HasForeignKey(d => d.AreaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Maquinas_Areas");

            entity.HasMany(d => d.Repuestos).WithMany(p => p.Maquinas)
                .UsingEntity<Dictionary<string, object>>(
                    "MaquinaRepuesto",
                    r => r.HasOne<Repuesto>().WithMany()
                        .HasForeignKey("RepuestoId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_MaqRep_Repuestos"),
                    l => l.HasOne<Maquina>().WithMany()
                        .HasForeignKey("MaquinaId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_MaqRep_Maquinas"),
                    j =>
                    {
                        j.HasKey("MaquinaId", "RepuestoId").HasName("PK__MaquinaR__0A1C88C239A2D36E");
                        j.ToTable("MaquinaRepuesto");
                        j.IndexerProperty<int>("MaquinaId").HasColumnName("MaquinaID");
                        j.IndexerProperty<int>("RepuestoId").HasColumnName("RepuestoID");
                    });
        });

        modelBuilder.Entity<MovimientosInventario>(entity =>
        {
            entity.HasKey(e => e.MovimientoId).HasName("PK__Movimien__BF923FCCDAB59AD3");

            entity.ToTable("MovimientosInventario");

            entity.Property(e => e.MovimientoId).HasColumnName("MovimientoID");
            entity.Property(e => e.Cantidad).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.Fecha).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Observaciones)
                .HasMaxLength(300)
                .IsUnicode(false);
            entity.Property(e => e.OrdenId).HasColumnName("OrdenID");
            entity.Property(e => e.RepuestoId).HasColumnName("RepuestoID");
            entity.Property(e => e.TipoMovimiento)
                .HasMaxLength(10)
                .IsUnicode(false);

            entity.HasOne(d => d.Orden).WithMany(p => p.MovimientosInventarios)
                .HasForeignKey(d => d.OrdenId)
                .HasConstraintName("FK_Movimientos_Ordenes");

            entity.HasOne(d => d.Repuesto).WithMany(p => p.MovimientosInventarios)
                .HasForeignKey(d => d.RepuestoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Movimientos_Repuestos");
        });

        modelBuilder.Entity<OrdenesTrabajo>(entity =>
        {
            entity.HasKey(e => e.OrdenId).HasName("PK__OrdenesT__C088A4E455FD2855");

            entity.ToTable("OrdenesTrabajo");

            entity.HasIndex(e => new { e.MaquinaId, e.Estado }, "IX_Ordenes_Maquina_Estado");

            entity.Property(e => e.OrdenId).HasColumnName("OrdenID");
            entity.Property(e => e.Descripcion)
                .HasMaxLength(300)
                .IsUnicode(false);
            entity.Property(e => e.DuracionMinutos).HasComputedColumnSql("(datediff(minute,[HoraInicio],[HoraFin]))", true);
            entity.Property(e => e.Estado)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("Pendiente");
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.HoraFin).HasPrecision(0);
            entity.Property(e => e.HoraInicio).HasPrecision(0);
            entity.Property(e => e.MaquinaId).HasColumnName("MaquinaID");
            entity.Property(e => e.Observaciones)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.PlanId).HasColumnName("PlanID");
            entity.Property(e => e.TipoMantenimientoId).HasColumnName("TipoMantenimientoID");
            entity.Property(e => e.UsuarioAsignadoId).HasColumnName("UsuarioAsignadoID");

            entity.HasOne(d => d.Maquina).WithMany(p => p.OrdenesTrabajos)
                .HasForeignKey(d => d.MaquinaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Ordenes_Maquinas");

            entity.HasOne(d => d.Plan).WithMany(p => p.OrdenesTrabajos)
                .HasForeignKey(d => d.PlanId)
                .HasConstraintName("FK_Ordenes_Planes");

            entity.HasOne(d => d.TipoMantenimiento).WithMany(p => p.OrdenesTrabajos)
                .HasForeignKey(d => d.TipoMantenimientoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Ordenes_Tipos");

            entity.HasOne(d => d.UsuarioAsignado).WithMany(p => p.OrdenesTrabajos)
                .HasForeignKey(d => d.UsuarioAsignadoId)
                .HasConstraintName("FK_Ordenes_Usuarios");
        });

        modelBuilder.Entity<ParosMaquina>(entity =>
        {
            entity.HasKey(e => e.ParoId).HasName("PK__ParosMaq__7E6FC3EFAAAB5594");

            entity.ToTable("ParosMaquina");

            entity.HasIndex(e => e.MaquinaId, "IX_Paros_Maquina");

            entity.Property(e => e.ParoId).HasColumnName("ParoID");
            entity.Property(e => e.Causa)
                .HasMaxLength(300)
                .IsUnicode(false);
            entity.Property(e => e.DuracionMinutos).HasComputedColumnSql("(datediff(minute,[FechaInicio],[FechaFin]))", true);
            entity.Property(e => e.MaquinaId).HasColumnName("MaquinaID");
            entity.Property(e => e.OrdenId).HasColumnName("OrdenID");

            entity.HasOne(d => d.Maquina).WithMany(p => p.ParosMaquinas)
                .HasForeignKey(d => d.MaquinaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Paros_Maquinas");

            entity.HasOne(d => d.Orden).WithMany(p => p.ParosMaquinas)
                .HasForeignKey(d => d.OrdenId)
                .HasConstraintName("FK_Paros_Ordenes");
        });

        modelBuilder.Entity<PlanesMantenimiento>(entity =>
        {
            entity.HasKey(e => e.PlanId).HasName("PK__PlanesMa__755C22D7309B823B");

            entity.ToTable("PlanesMantenimiento");

            entity.Property(e => e.PlanId).HasColumnName("PlanID");
            entity.Property(e => e.Activo).HasDefaultValue(true);
            entity.Property(e => e.MaquinaId).HasColumnName("MaquinaID");
            entity.Property(e => e.NombrePlan)
                .HasMaxLength(150)
                .IsUnicode(false);

            entity.HasOne(d => d.Maquina).WithMany(p => p.PlanesMantenimientos)
                .HasForeignKey(d => d.MaquinaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Planes_Maquinas");
        });

        modelBuilder.Entity<Repuesto>(entity =>
        {
            entity.HasKey(e => e.RepuestoId).HasName("PK__Repuesto__75B30774977E3BD5");

            entity.HasIndex(e => e.Codigo, "UQ__Repuesto__06370DAC83A34306").IsUnique();

            entity.Property(e => e.RepuestoId).HasColumnName("RepuestoID");
            entity.Property(e => e.CategoriaId).HasColumnName("CategoriaID");
            entity.Property(e => e.Codigo)
                .HasMaxLength(30)
                .IsUnicode(false);
            entity.Property(e => e.CostoUnitario).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.Nombre)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.StockActual).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.StockMinimo).HasColumnType("decimal(12, 2)");

            entity.HasOne(d => d.Categoria).WithMany(p => p.Repuestos)
                .HasForeignKey(d => d.CategoriaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Repuestos_Categorias");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RolId).HasName("PK__Roles__F92302D150E2C7D5");

            entity.HasIndex(e => e.NombreRol, "UQ__Roles__4F0B537F9A98DD28").IsUnique();

            entity.Property(e => e.RolId).HasColumnName("RolID");
            entity.Property(e => e.Descripcion)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.NombreRol)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<TareasPlan>(entity =>
        {
            entity.HasKey(e => e.TareaId).HasName("PK__TareasPl__5CD83671EA0452DA");

            entity.ToTable("TareasPlan");

            entity.Property(e => e.TareaId).HasColumnName("TareaID");
            entity.Property(e => e.Descripcion)
                .HasMaxLength(300)
                .IsUnicode(false);
            entity.Property(e => e.PlanId).HasColumnName("PlanID");

            entity.HasOne(d => d.Plan).WithMany(p => p.TareasPlans)
                .HasForeignKey(d => d.PlanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tareas_Planes");
        });

        modelBuilder.Entity<TiposMantenimiento>(entity =>
        {
            entity.HasKey(e => e.TipoMantenimientoId).HasName("PK__TiposMan__CF3911E7E830A879");

            entity.ToTable("TiposMantenimiento");

            entity.HasIndex(e => e.Nombre, "UQ__TiposMan__75E3EFCF97B86161").IsUnique();

            entity.Property(e => e.TipoMantenimientoId).HasColumnName("TipoMantenimientoID");
            entity.Property(e => e.Nombre)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.UsuarioId).HasName("PK__Usuarios__2B3DE79888496626");

            entity.HasIndex(e => e.CorreoElectronico, "UQ__Usuarios__531402F364EFA6D3").IsUnique();

            entity.Property(e => e.UsuarioId).HasColumnName("UsuarioID");
            entity.Property(e => e.Activo).HasDefaultValue(true);
            entity.Property(e => e.ContrasenaHash).HasMaxLength(256);
            entity.Property(e => e.CorreoElectronico)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.NombreCompleto)
                .HasMaxLength(120)
                .IsUnicode(false);
            entity.Property(e => e.RolId).HasColumnName("RolID");

            entity.HasOne(d => d.Rol).WithMany(p => p.Usuarios)
                .HasForeignKey(d => d.RolId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Usuarios_Roles");
        });

        modelBuilder.Entity<VwConsumoRepuesto>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_ConsumoRepuestos");

            entity.Property(e => e.Cantidad).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.ConsumoId).HasColumnName("ConsumoID");
            entity.Property(e => e.CostoTotal).HasColumnType("decimal(25, 4)");
            entity.Property(e => e.CostoUnitario).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.NombreRepuesto)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.OrdenId).HasColumnName("OrdenID");
            entity.Property(e => e.RepuestoId).HasColumnName("RepuestoID");
        });

        modelBuilder.Entity<VwMtbf>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_MTBF");

            entity.Property(e => e.MaquinaId).HasColumnName("MaquinaID");
            entity.Property(e => e.MtbfHoras)
                .HasColumnType("numeric(38, 6)")
                .HasColumnName("MTBF_Horas");
            entity.Property(e => e.Nombre)
                .HasMaxLength(120)
                .IsUnicode(false);
        });

        modelBuilder.Entity<VwMttr>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_MTTR");

            entity.Property(e => e.MaquinaId).HasColumnName("MaquinaID");
            entity.Property(e => e.MttrHoras)
                .HasColumnType("numeric(38, 6)")
                .HasColumnName("MTTR_Horas");
            entity.Property(e => e.Nombre)
                .HasMaxLength(120)
                .IsUnicode(false);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
