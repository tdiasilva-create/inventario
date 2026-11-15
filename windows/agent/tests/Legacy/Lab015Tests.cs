using System.Globalization;
using Semed.Agent.Qr;
using Semed.Agent.Util;

namespace Semed.Agent.Tests;

/// <summary>Regressões do 1º laboratório em Windows real (0.1.5, 03/11/2026).</summary>
public static class Lab015Tests
{
    [Test]
    public static void L015_1_data_local_de_exibicao_funciona_em_InvariantGlobalization()
    {
        // O processo de teste herda InvariantGlobalization=true (Directory.Build.props), como a interface.
        Assert.True(CultureInfo.CurrentCulture.Name == "" || AppContext.TryGetSwitch("System.Globalization.Invariant", out var inv) && inv,
            "o teste deve rodar no mesmo modo de globalização da interface");
        var brt = TimeZoneInfo.CreateCustomTimeZone("BRT-teste", TimeSpan.FromHours(-3), "BRT", "BRT");
        Assert.Equal("03/11/2026 20:39", Iso.FormatLocalDisplay("2026-11-03T23:39:12Z", brt));
        Assert.Equal("—", Iso.FormatLocalDisplay(null, brt));
        Assert.Equal("—", Iso.FormatLocalDisplay("não é data", brt));
    }

    [Test]
    public static void L015_2_interface_nao_usa_dados_de_cultura_inexistentes_no_modo_invariante()
    {
        var root = AppContext.BaseDirectory;
        // 0.1.9 recompiles only Core. Original 0.1.8 UI is byte-for-byte preserved by the installer.
        while (root is not null && !Directory.Exists(Path.Combine(root, "src", "Core"))) root = Path.GetDirectoryName(root);
        Assert.True(root is not null, "pasta src/Core não encontrada");
        foreach (var f in Directory.GetFiles(Path.Combine(root!, "src"), "*.cs", SearchOption.AllDirectories))
        {
            if (f.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}")) continue;
            var txt = File.ReadAllText(f);
            Assert.False(txt.Contains("GetCultureInfo(\"") || txt.Contains("new CultureInfo(\""), $"cultura nomeada em {Path.GetFileName(f)} lança CultureNotFoundException com InvariantGlobalization");
        }
    }

    [Test]
    public static void L015_3_QR_de_pareamento_tamanho_real_codifica()
    {
        var payload = "SEMEDPAIR1:" + new string('A', 36) + ":" + new string('b', 43) + ":api.exemplo.invalid";
        var qr = QrCode.EncodeText(payload, QrCode.Ecc.M);
        Assert.True(qr.Size >= 21 && qr.Size <= 177);
    }
}
