using CMMS_MANT_PREVENTIVOS.Data;
using CMMS_MANT_PREVENTIVOS.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CMMS_MANT_PREVENTIVOS.Controllers;

// Solo lectura: expone las vistas de confiabilidad calculadas directamente en SQL Server
[ApiController]
[Route("api/[controller]")]
public class IndicadoresController : ControllerBase
{
    private readonly CmmsDbContext _context;

    public IndicadoresController(CmmsDbContext context)
    {
        _context = context;
    }

    [HttpGet("mtbf")]
    public async Task<ActionResult<IEnumerable<MtbfDto>>> GetMtbf()
    {
        var datos = await _context.VwMtbfs
            .Select(v => new MtbfDto { MaquinaId = v.MaquinaId, Nombre = v.Nombre, MtbfHoras = v.MtbfHoras })
            .ToListAsync();
        return Ok(datos);
    }

    [HttpGet("mtbf/{maquinaId}")]
    public async Task<ActionResult<MtbfDto>> GetMtbfPorMaquina(int maquinaId)
    {
        var dato = await _context.VwMtbfs.FirstOrDefaultAsync(v => v.MaquinaId == maquinaId);
        if (dato is null) return NotFound("No hay suficientes paros registrados para calcular el MTBF de esta máquina.");
        return Ok(new MtbfDto { MaquinaId = dato.MaquinaId, Nombre = dato.Nombre, MtbfHoras = dato.MtbfHoras });
    }

    [HttpGet("mttr")]
    public async Task<ActionResult<IEnumerable<MttrDto>>> GetMttr()
    {
        var datos = await _context.VwMttrs
            .Select(v => new MttrDto { MaquinaId = v.MaquinaId, Nombre = v.Nombre, MttrHoras = v.MttrHoras, TotalParos = v.TotalParos })
            .ToListAsync();
        return Ok(datos);
    }

    [HttpGet("mttr/{maquinaId}")]
    public async Task<ActionResult<MttrDto>> GetMttrPorMaquina(int maquinaId)
    {
        var dato = await _context.VwMttrs.FirstOrDefaultAsync(v => v.MaquinaId == maquinaId);
        if (dato is null) return NotFound("No hay paros cerrados registrados para calcular el MTTR de esta máquina.");
        return Ok(new MttrDto { MaquinaId = dato.MaquinaId, Nombre = dato.Nombre, MttrHoras = dato.MttrHoras, TotalParos = dato.TotalParos });
    }

    [HttpGet("consumo-repuestos")]
    public async Task<ActionResult<IEnumerable<ConsumoRepuestoResumenDto>>> GetConsumoRepuestos()
    {
        var datos = await _context.VwConsumoRepuestos
            .OrderByDescending(v => v.FechaConsumo)
            .Select(v => new ConsumoRepuestoResumenDto
            {
                ConsumoId = v.ConsumoId,
                OrdenId = v.OrdenId,
                RepuestoId = v.RepuestoId,
                NombreRepuesto = v.NombreRepuesto,
                Cantidad = v.Cantidad,
                CostoUnitario = v.CostoUnitario,
                CostoTotal = v.CostoTotal,
                FechaConsumo = v.FechaConsumo
            })
            .ToListAsync();
        return Ok(datos);
    }

    [HttpGet("consumo-repuestos/por-orden/{ordenId}")]
    public async Task<ActionResult<IEnumerable<ConsumoRepuestoResumenDto>>> GetConsumoRepuestosPorOrden(int ordenId)
    {
        var datos = await _context.VwConsumoRepuestos
            .Where(v => v.OrdenId == ordenId)
            .Select(v => new ConsumoRepuestoResumenDto
            {
                ConsumoId = v.ConsumoId,
                OrdenId = v.OrdenId,
                RepuestoId = v.RepuestoId,
                NombreRepuesto = v.NombreRepuesto,
                Cantidad = v.Cantidad,
                CostoUnitario = v.CostoUnitario,
                CostoTotal = v.CostoTotal,
                FechaConsumo = v.FechaConsumo
            })
            .ToListAsync();
        return Ok(datos);
    }
}