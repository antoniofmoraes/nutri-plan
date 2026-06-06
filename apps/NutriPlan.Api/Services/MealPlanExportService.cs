using System.Text;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using WP = DocumentFormat.OpenXml.Wordprocessing;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using NutriPlan.Api.DTOs;

namespace NutriPlan.Api.Services;

public class MealPlanExportService
{
    static MealPlanExportService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    private static readonly string[] DayOrder =
        ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];

    private static readonly Dictionary<string, string> DayLabels = new()
    {
        ["segunda"] = "Segunda-feira",
        ["terca"] = "Terça-feira",
        ["quarta"] = "Quarta-feira",
        ["quinta"] = "Quinta-feira",
        ["sexta"] = "Sexta-feira",
        ["sabado"] = "Sábado",
        ["domingo"] = "Domingo",
    };

    private static readonly Dictionary<string, string> GoalLabels = new()
    {
        ["emagrecer"] = "Emagrecimento",
        ["manter"] = "Manutenção",
        ["ganhar"] = "Ganho de Massa",
    };

    private static (double Cal, double Prot, double Carb, double Fat) CalcMealMacros(MealResponse meal)
    {
        double cal = 0, p = 0, c = 0, f = 0;
        foreach (var mf in meal.Foods)
        {
            cal += mf.Food.Calories * mf.Quantity / 100;
            p += mf.Food.Protein * mf.Quantity / 100;
            c += mf.Food.Carbs * mf.Quantity / 100;
            f += mf.Food.Fat * mf.Quantity / 100;
        }
        return (cal, p, c, f);
    }

    private static (double Cal, double Prot, double Carb, double Fat) CalcDayMacros(DayPlanResponse day)
    {
        double cal = 0, p = 0, c = 0, f = 0;
        foreach (var meal in day.Meals.Where(m => !m.IsCheat))
        {
            var m = CalcMealMacros(meal);
            cal += m.Cal; p += m.Prot; c += m.Carb; f += m.Fat;
        }
        return (cal, p, c, f);
    }

    private static IEnumerable<DayPlanResponse> OrderedDays(MealPlanResponse plan) =>
        plan.Days.OrderBy(d => Array.IndexOf(DayOrder, d.Day));

    private static IEnumerable<MealResponse> SortedMeals(DayPlanResponse day, MealPlanResponse plan) =>
        day.Meals.OrderBy(m => plan.Slots.FirstOrDefault(s => s.Id == m.SlotId)?.SortOrder ?? 0);

    // ─── Markdown ──────────────────────────────────────────────────────────────

    public string GenerateMarkdown(MealPlanResponse plan)
    {
        var sb = new StringBuilder();
        var goalLabel = GoalLabels.GetValueOrDefault(plan.Goal, plan.Goal);

        sb.AppendLine($"# {plan.Name}");
        sb.AppendLine();
        sb.Append($"**Objetivo:** {goalLabel}  ·  **Meta diária:** {plan.DailyCalories} kcal");

        var macroParts = new List<string>();
        if (plan.DailyProtein.HasValue) macroParts.Add($"**Proteína:** {plan.DailyProtein}g");
        if (plan.DailyCarbs.HasValue) macroParts.Add($"**Carboidratos:** {plan.DailyCarbs}g");
        if (plan.DailyFat.HasValue) macroParts.Add($"**Gordura:** {plan.DailyFat}g");
        if (macroParts.Count > 0) sb.Append("  ·  " + string.Join("  ·  ", macroParts));
        sb.AppendLine();
        sb.AppendLine();
        sb.AppendLine("---");
        sb.AppendLine();

        foreach (var day in OrderedDays(plan))
        {
            var dayLabel = DayLabels.GetValueOrDefault(day.Day, day.Day);
            sb.AppendLine($"## {dayLabel}");
            sb.AppendLine();

            foreach (var meal in SortedMeals(day, plan))
            {
                var mealTitle = meal.Time != null ? $"{meal.Name} · {meal.Time}" : meal.Name;
                sb.AppendLine($"### {mealTitle}");
                sb.AppendLine();

                if (meal.IsCheat)
                {
                    sb.AppendLine("_Refeição livre_");
                    sb.AppendLine();
                    continue;
                }

                if (meal.Foods.Count == 0)
                {
                    sb.AppendLine("_Sem alimentos cadastrados_");
                    sb.AppendLine();
                    continue;
                }

                sb.AppendLine("| Alimento | Qtd (g) | Kcal | Prot (g) | Carb (g) | Gord (g) |");
                sb.AppendLine("|---|---|---|---|---|---|");
                foreach (var mf in meal.Foods)
                {
                    var cal = mf.Food.Calories * mf.Quantity / 100;
                    var p = mf.Food.Protein * mf.Quantity / 100;
                    var c = mf.Food.Carbs * mf.Quantity / 100;
                    var f = mf.Food.Fat * mf.Quantity / 100;
                    sb.AppendLine($"| {mf.Food.Name} | {mf.Quantity:F0} | {cal:F0} | {p:F1} | {c:F1} | {f:F1} |");
                }

                var mm = CalcMealMacros(meal);
                sb.AppendLine();
                sb.AppendLine($"**Total:** {mm.Cal:F0} kcal · P {mm.Prot:F1}g · C {mm.Carb:F1}g · G {mm.Fat:F1}g");
                sb.AppendLine();
            }

            var dm = CalcDayMacros(day);
            sb.AppendLine($"> **Total do dia:** {dm.Cal:F0} kcal · P {dm.Prot:F1}g · C {dm.Carb:F1}g · G {dm.Fat:F1}g");
            sb.AppendLine();
            sb.AppendLine("---");
            sb.AppendLine();
        }

        return sb.ToString();
    }

    // ─── DOCX ──────────────────────────────────────────────────────────────────

    public byte[] GenerateDocx(MealPlanResponse plan)
    {
        using var ms = new MemoryStream();
        using (var doc = WordprocessingDocument.Create(ms, WordprocessingDocumentType.Document, true))
        {
            var mainPart = doc.AddMainDocumentPart();
            mainPart.Document = new WP.Document();
            var body = mainPart.Document.AppendChild(new WP.Body());

            var goalLabel = GoalLabels.GetValueOrDefault(plan.Goal, plan.Goal);

            body.AppendChild(DocxPara(plan.Name, fontSize: 48, bold: true));

            var subtitle = $"Objetivo: {goalLabel}  ·  Meta diária: {plan.DailyCalories} kcal";
            if (plan.DailyProtein.HasValue) subtitle += $"  ·  P: {plan.DailyProtein}g";
            if (plan.DailyCarbs.HasValue) subtitle += $"  ·  C: {plan.DailyCarbs}g";
            if (plan.DailyFat.HasValue) subtitle += $"  ·  G: {plan.DailyFat}g";
            body.AppendChild(DocxPara(subtitle, fontSize: 20, color: "666666", spaceAfter: 400));

            foreach (var day in OrderedDays(plan))
            {
                var dayLabel = DayLabels.GetValueOrDefault(day.Day, day.Day);
                body.AppendChild(DocxPara(dayLabel, fontSize: 32, bold: true, spaceBefore: 320, spaceAfter: 80));

                foreach (var meal in SortedMeals(day, plan))
                {
                    var mealTitle = meal.Time != null ? $"{meal.Name}  ·  {meal.Time}" : meal.Name;
                    body.AppendChild(DocxPara(mealTitle, fontSize: 26, bold: true, spaceBefore: 160, spaceAfter: 60));

                    if (meal.IsCheat)
                    {
                        body.AppendChild(DocxPara("Refeição livre", fontSize: 20, italic: true, color: "888888"));
                        continue;
                    }

                    if (meal.Foods.Count == 0)
                    {
                        body.AppendChild(DocxPara("Sem alimentos cadastrados", fontSize: 20, italic: true, color: "888888"));
                        continue;
                    }

                    body.AppendChild(DocxFoodsTable(meal.Foods));

                    var mm = CalcMealMacros(meal);
                    body.AppendChild(DocxPara(
                        $"Total: {mm.Cal:F0} kcal  ·  P {mm.Prot:F1}g  ·  C {mm.Carb:F1}g  ·  G {mm.Fat:F1}g",
                        fontSize: 20, italic: true, color: "555555", spaceAfter: 40));
                }

                var dm = CalcDayMacros(day);
                body.AppendChild(DocxPara(
                    $"Total do dia: {dm.Cal:F0} kcal  ·  P {dm.Prot:F1}g  ·  C {dm.Carb:F1}g  ·  G {dm.Fat:F1}g",
                    fontSize: 22, bold: true, spaceBefore: 80, spaceAfter: 80));
            }

            mainPart.Document.Save();
        }

        return ms.ToArray();
    }

    private static WP.Paragraph DocxPara(string text, int fontSize = 22, bool bold = false, bool italic = false,
        string? color = null, int spaceBefore = 0, int spaceAfter = 0)
    {
        var run = new WP.Run();
        var rpr = new WP.RunProperties();
        rpr.AppendChild(new WP.FontSize { Val = fontSize.ToString() });
        rpr.AppendChild(new WP.FontSizeComplexScript { Val = fontSize.ToString() });
        if (bold) rpr.AppendChild(new WP.Bold());
        if (italic) rpr.AppendChild(new WP.Italic());
        if (color != null) rpr.AppendChild(new WP.Color { Val = color });
        run.AppendChild(rpr);
        run.AppendChild(new WP.Text(text) { Space = SpaceProcessingModeValues.Preserve });

        var para = new WP.Paragraph();
        var ppr = new WP.ParagraphProperties();
        var spacing = new WP.SpacingBetweenLines();
        if (spaceBefore > 0) spacing.Before = spaceBefore.ToString();
        if (spaceAfter > 0) spacing.After = spaceAfter.ToString();
        if (spaceBefore > 0 || spaceAfter > 0) ppr.AppendChild(spacing);
        para.AppendChild(ppr);
        para.AppendChild(run);
        return para;
    }

    private static WP.Table DocxFoodsTable(List<MealFoodResponse> foods)
    {
        var table = new WP.Table();

        var tblProps = new WP.TableProperties();
        tblProps.AppendChild(new WP.TableWidth { Width = "9360", Type = WP.TableWidthUnitValues.Dxa });
        tblProps.AppendChild(new WP.TableBorders(
            new WP.TopBorder { Val = WP.BorderValues.Single, Size = 4, Space = 0, Color = "CCCCCC" },
            new WP.BottomBorder { Val = WP.BorderValues.Single, Size = 4, Space = 0, Color = "CCCCCC" },
            new WP.LeftBorder { Val = WP.BorderValues.Single, Size = 4, Space = 0, Color = "CCCCCC" },
            new WP.RightBorder { Val = WP.BorderValues.Single, Size = 4, Space = 0, Color = "CCCCCC" },
            new WP.InsideHorizontalBorder { Val = WP.BorderValues.Single, Size = 4, Space = 0, Color = "CCCCCC" },
            new WP.InsideVerticalBorder { Val = WP.BorderValues.Single, Size = 4, Space = 0, Color = "CCCCCC" }
        ));
        table.AppendChild(tblProps);

        var colWidths = new[] { 3800, 1000, 1100, 1100, 1100, 1260 };
        var headers = new[] { "Alimento", "Qtd (g)", "Kcal", "Prot (g)", "Carb (g)", "Gord (g)" };

        var headerRow = new WP.TableRow();
        for (var i = 0; i < headers.Length; i++)
            headerRow.AppendChild(DocxCell(headers[i], colWidths[i], bold: true, background: "F0F0F0"));
        table.AppendChild(headerRow);

        foreach (var mf in foods)
        {
            var cal = mf.Food.Calories * mf.Quantity / 100;
            var p = mf.Food.Protein * mf.Quantity / 100;
            var c = mf.Food.Carbs * mf.Quantity / 100;
            var f = mf.Food.Fat * mf.Quantity / 100;

            var row = new WP.TableRow();
            row.AppendChild(DocxCell(mf.Food.Name, colWidths[0]));
            row.AppendChild(DocxCell($"{mf.Quantity:F0}", colWidths[1]));
            row.AppendChild(DocxCell($"{cal:F0}", colWidths[2]));
            row.AppendChild(DocxCell($"{p:F1}", colWidths[3]));
            row.AppendChild(DocxCell($"{c:F1}", colWidths[4]));
            row.AppendChild(DocxCell($"{f:F1}", colWidths[5]));
            table.AppendChild(row);
        }

        return table;
    }

    private static WP.TableCell DocxCell(string text, int widthTwips, bool bold = false, string? background = null)
    {
        var cell = new WP.TableCell();

        var tcp = new WP.TableCellProperties();
        tcp.AppendChild(new WP.TableCellWidth { Width = widthTwips.ToString(), Type = WP.TableWidthUnitValues.Dxa });
        if (background != null)
            tcp.AppendChild(new WP.Shading { Fill = background, Color = "auto", Val = WP.ShadingPatternValues.Clear });
        cell.AppendChild(tcp);

        var run = new WP.Run();
        var rpr = new WP.RunProperties();
        rpr.AppendChild(new WP.FontSize { Val = "18" });
        rpr.AppendChild(new WP.FontSizeComplexScript { Val = "18" });
        if (bold) rpr.AppendChild(new WP.Bold());
        run.AppendChild(rpr);
        run.AppendChild(new WP.Text(text) { Space = SpaceProcessingModeValues.Preserve });

        var para = new WP.Paragraph();
        para.AppendChild(new WP.ParagraphProperties(
            new WP.SpacingBetweenLines { Before = "0", After = "60" }));
        para.AppendChild(run);
        cell.AppendChild(para);

        return cell;
    }

    // ─── PDF ───────────────────────────────────────────────────────────────────

    public byte[] GeneratePdf(MealPlanResponse plan)
    {
        var goalLabel = GoalLabels.GetValueOrDefault(plan.Goal, plan.Goal);

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(t => t.FontSize(10));

                page.Content().Column(col =>
                {
                    col.Item().Column(header =>
                    {
                        header.Item().Text(plan.Name).FontSize(22).Bold();
                        header.Item().PaddingTop(4).Text(t =>
                        {
                            t.Span($"{goalLabel}  ·  {plan.DailyCalories} kcal/dia")
                             .FontColor(Colors.Grey.Darken2).FontSize(10);
                            if (plan.DailyProtein.HasValue)
                                t.Span($"  ·  P {plan.DailyProtein}g").FontColor(Colors.Grey.Darken2).FontSize(10);
                            if (plan.DailyCarbs.HasValue)
                                t.Span($"  ·  C {plan.DailyCarbs}g").FontColor(Colors.Grey.Darken2).FontSize(10);
                            if (plan.DailyFat.HasValue)
                                t.Span($"  ·  G {plan.DailyFat}g").FontColor(Colors.Grey.Darken2).FontSize(10);
                        });
                    });

                    col.Item().PaddingVertical(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                    foreach (var day in OrderedDays(plan))
                    {
                        var dayLabel = DayLabels.GetValueOrDefault(day.Day, day.Day);
                        var dm = CalcDayMacros(day);

                        col.Item().PaddingTop(14).Column(dayCol =>
                        {
                            dayCol.Item().Row(row =>
                            {
                                row.RelativeItem().Text(dayLabel).FontSize(13).Bold();
                                row.AutoItem()
                                   .Text($"Total: {dm.Cal:F0} kcal · P {dm.Prot:F1}g · C {dm.Carb:F1}g · G {dm.Fat:F1}g")
                                   .FontSize(8).FontColor(Colors.Grey.Darken1);
                            });
                            dayCol.Item().PaddingTop(3).LineHorizontal(1).LineColor(Colors.Grey.Lighten1);

                            foreach (var meal in SortedMeals(day, plan))
                            {
                                var mealTitle = meal.Time != null ? $"{meal.Name}  ·  {meal.Time}" : meal.Name;

                                dayCol.Item().PaddingTop(10).Column(mealCol =>
                                {
                                    mealCol.Item().Text(mealTitle).FontSize(11).SemiBold();

                                    if (meal.IsCheat)
                                    {
                                        mealCol.Item().PaddingTop(4)
                                               .Text("Refeição livre").Italic().FontColor(Colors.Grey.Darken1);
                                        return;
                                    }

                                    if (meal.Foods.Count == 0)
                                    {
                                        mealCol.Item().PaddingTop(4)
                                               .Text("Sem alimentos cadastrados").Italic().FontColor(Colors.Grey.Darken1);
                                        return;
                                    }

                                    mealCol.Item().PaddingTop(5).Table(table =>
                                    {
                                        table.ColumnsDefinition(cols =>
                                        {
                                            cols.RelativeColumn(5);
                                            cols.RelativeColumn(1.5f);
                                            cols.RelativeColumn(1.5f);
                                            cols.RelativeColumn(1.5f);
                                            cols.RelativeColumn(1.5f);
                                            cols.RelativeColumn(1.5f);
                                        });

                                        foreach (var h in new[] { "Alimento", "Qtd (g)", "Kcal", "Prot (g)", "Carb (g)", "Gord (g)" })
                                            table.Cell().Background(Colors.Grey.Lighten3)
                                                 .Padding(4).Text(h).Bold().FontSize(8);

                                        foreach (var (mf, idx) in meal.Foods.Select((m, i) => (m, i)))
                                        {
                                            var bg = idx % 2 == 0 ? Colors.White : Colors.Grey.Lighten5;
                                            var cal = mf.Food.Calories * mf.Quantity / 100;
                                            var p = mf.Food.Protein * mf.Quantity / 100;
                                            var c = mf.Food.Carbs * mf.Quantity / 100;
                                            var f = mf.Food.Fat * mf.Quantity / 100;

                                            table.Cell().Background(bg).Padding(4).Text(mf.Food.Name).FontSize(8);
                                            table.Cell().Background(bg).Padding(4).Text($"{mf.Quantity:F0}").FontSize(8);
                                            table.Cell().Background(bg).Padding(4).Text($"{cal:F0}").FontSize(8);
                                            table.Cell().Background(bg).Padding(4).Text($"{p:F1}").FontSize(8);
                                            table.Cell().Background(bg).Padding(4).Text($"{c:F1}").FontSize(8);
                                            table.Cell().Background(bg).Padding(4).Text($"{f:F1}").FontSize(8);
                                        }

                                        var mm = CalcMealMacros(meal);
                                        table.Cell().Background(Colors.Grey.Lighten2).Padding(4).Text("Total").Bold().FontSize(8);
                                        table.Cell().Background(Colors.Grey.Lighten2).Padding(4).Text("").FontSize(8);
                                        table.Cell().Background(Colors.Grey.Lighten2).Padding(4).Text($"{mm.Cal:F0}").Bold().FontSize(8);
                                        table.Cell().Background(Colors.Grey.Lighten2).Padding(4).Text($"{mm.Prot:F1}").Bold().FontSize(8);
                                        table.Cell().Background(Colors.Grey.Lighten2).Padding(4).Text($"{mm.Carb:F1}").Bold().FontSize(8);
                                        table.Cell().Background(Colors.Grey.Lighten2).Padding(4).Text($"{mm.Fat:F1}").Bold().FontSize(8);
                                    });
                                });
                            }
                        });
                    }
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("NutriPlan  ·  Página ").FontSize(8).FontColor(Colors.Grey.Medium);
                    x.CurrentPageNumber().FontSize(8).FontColor(Colors.Grey.Medium);
                    x.Span(" de ").FontSize(8).FontColor(Colors.Grey.Medium);
                    x.TotalPages().FontSize(8).FontColor(Colors.Grey.Medium);
                });
            });
        }).GeneratePdf();
    }
}
