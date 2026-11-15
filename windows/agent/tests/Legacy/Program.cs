// Executor de testes mínimo (sem dependências NuGet). Uso:
//   dotnet run --project tests/Semed.Agent.Tests                       → todos os testes
//   dotnet run --project tests/Semed.Agent.Tests -- vectors IN OUT     → vetores .NET ↔ Web Crypto
//   dotnet run --project tests/Semed.Agent.Tests -- qr OUT.json        → matrizes QR para decodificação externa
//   dotnet run --project tests/Semed.Agent.Tests -- samples DIR        → JSONs reais do agente para validar no schema
using System.Reflection;
using Semed.Agent.Tests;

if (args.Length > 0 && args[0] == "vectors") return Vectors.Run(args[1], args[2]);
if (args.Length > 0 && args[0] == "qr") return QrExport.Run(args[1]);
if (args.Length > 0 && args[0] == "samples") return Samples.Run(args[1]);

var tests = typeof(Program).Assembly.GetTypes()
    .SelectMany(t => t.GetMethods(BindingFlags.Public | BindingFlags.Static))
    .Where(m => m.GetCustomAttribute<TestAttribute>() is not null)
    .OrderBy(m => m.DeclaringType!.Name).ThenBy(m => m.Name)
    .ToList();
var filter = args.Length > 0 ? args[0] : null;
int pass = 0, fail = 0;
foreach (var m in tests)
{
    var name = $"{m.DeclaringType!.Name}.{m.Name}";
    if (filter is not null && !name.Contains(filter, StringComparison.OrdinalIgnoreCase)) continue;
    try
    {
        var r = m.Invoke(null, null);
        if (r is Task t) await t;
        Console.WriteLine($"  ok    {name}");
        pass++;
    }
    catch (Exception ex)
    {
        var e = ex is TargetInvocationException { InnerException: { } inner } ? inner : ex;
        Console.WriteLine($"  FALHA {name}: {e.GetType().Name}: {e.Message}");
        fail++;
    }
}
Console.WriteLine($"\n{pass} ok, {fail} falha(s)");
return fail == 0 ? 0 : 1;

namespace Semed.Agent.Tests
{
    [AttributeUsage(AttributeTargets.Method)]
    public sealed class TestAttribute : Attribute;

    public static class Assert
    {
        public static void True(bool c, string msg = "condição falsa") { if (!c) throw new Exception(msg); }
        public static void False(bool c, string msg = "condição verdadeira") { if (c) throw new Exception(msg); }
        public static void Equal<T>(T expected, T actual, string? msg = null)
        {
            if (!EqualityComparer<T>.Default.Equals(expected, actual)) throw new Exception($"{msg ?? "diferente"}: esperado <{expected}>, obtido <{actual}>");
        }
        public static void NotEqual<T>(T a, T b, string? msg = null)
        {
            if (EqualityComparer<T>.Default.Equals(a, b)) throw new Exception($"{msg ?? "iguais"}: <{a}>");
        }
        public static TEx Throws<TEx>(Action a) where TEx : Exception
        {
            try { a(); }
            catch (TEx e) { return e; }
            throw new Exception($"esperava {typeof(TEx).Name}");
        }
    }
}
