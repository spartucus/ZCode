import { SyntaxStyle, type ThemeTokenStyle } from "@mbears/opentui-core";
import type { TuiThemeTokens } from "./theme/index.js";

function markdownSyntaxRules(theme: TuiThemeTokens): ThemeTokenStyle[] {
  return [
    token(["default"], { foreground: theme.markdownText }),
    token(["markup.heading", "markup.heading.1", "markup.heading.2", "markup.heading.3"], {
      bold: true,
      foreground: theme.markdownHeading,
    }),
    token(["markup.heading.4", "markup.heading.5", "markup.heading.6"], {
      bold: true,
      foreground: theme.markdownHeading,
    }),
    token(["markup.bold", "markup.strong"], {
      bold: true,
      foreground: theme.markdownStrong,
    }),
    token(["markup.italic"], { foreground: theme.markdownEmph, italic: true }),
    token(["markup.list"], { foreground: theme.markdownListItem }),
    token(["markup.quote"], { foreground: theme.markdownBlockQuote, italic: true }),
    token(["markup.raw", "markup.raw.block"], { foreground: theme.markdownCodeBlock }),
    token(["markup.raw.inline"], {
      background: theme.backgroundPanel,
      foreground: theme.markdownCode,
    }),
    token(["markup.link", "markup.link.url"], {
      foreground: theme.markdownLink,
      underline: true,
    }),
    token(["markup.link.label", "label"], {
      foreground: theme.markdownLinkText,
      underline: true,
    }),
    token(["conceal"], { foreground: theme.textMuted }),
    token(["comment"], { foreground: theme.syntaxComment, italic: true }),
    token(["string", "symbol"], { foreground: theme.syntaxString }),
    token(["number", "boolean"], { foreground: theme.syntaxNumber }),
    token(["keyword"], { foreground: theme.syntaxKeyword }),
    token(["function", "function.call", "function.method.call"], {
      foreground: theme.syntaxFunction,
    }),
    token(["type", "type.builtin"], { foreground: theme.syntaxType }),
    token(["operator"], { foreground: theme.syntaxOperator }),
    token(["punctuation", "punctuation.bracket"], { foreground: theme.syntaxPunctuation }),
    token(["diff.plus"], { foreground: theme.diffAdded }),
    token(["diff.minus"], { foreground: theme.diffRemoved }),
    token(["diff.delta"], { foreground: theme.diffHunkHeader }),
    token(["error"], { foreground: theme.error }),
    token(["warning"], { foreground: theme.warning }),
    token(["info"], { foreground: theme.info }),
  ];
}

// 修复 native 内存泄漏（2026-10-10 WSL OOM 案）：MarkdownText 每次 React 渲染都会调用
// 本函数，而 SyntaxStyle.fromTheme 每次都在 native 侧（libopentui）新分配一套样式对象；
// opentui 的 MarkdownRenderable setter 只换引用、不 destroy 旧值（归属约定：调用方负责
// 释放），于是每个流式 token 触发的全树重渲染都给每个已挂载 markdown 实例泄漏一个
// native SyntaxStyle（实测 32 条约 12KB/个；571 消息会话每轮渲染泄 ~3.5MB，
// 70 分钟涨 ~6GB）。按 theme 对象缓存共享实例后，对象身份稳定、reconciler 不再触发
// setter，泄漏与附带的全量重高亮同时消失。共享实例常驻不 destroy（挂载期间一直被
// 引用）；theme 来自 BUILTIN_TUI_THEMES 常驻对象，WeakMap 仅防御未来动态主题。
const markdownSyntaxStyleCache = new WeakMap<TuiThemeTokens, SyntaxStyle | undefined>();

export function createMarkdownSyntaxStyle(theme: TuiThemeTokens): SyntaxStyle | undefined {
  if (markdownSyntaxStyleCache.has(theme)) {
    return markdownSyntaxStyleCache.get(theme);
  }
  let style: SyntaxStyle | undefined;
  try {
    style = SyntaxStyle.fromTheme(markdownSyntaxRules(theme));
  } catch {
    style = undefined;
  }
  markdownSyntaxStyleCache.set(theme, style);
  return style;
}

function token(scope: string[], style: ThemeTokenStyle["style"]): ThemeTokenStyle {
  return { scope, style };
}
