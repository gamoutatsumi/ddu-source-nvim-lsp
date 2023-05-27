import { ActionData, BaseSource, Context, Denops, fn, Item } from "./deps.ts";

type Params = {
  path: string;
};

enum TYPE_DIAGNOSTICS {
  "Undefined",
  "Error",
  "Warning",
  "Information",
  "Hint",
}

enum HIGHLIGHT_DIAGNOSTICS {
  "Undefined",
  "DiagnosticError",
  "DiagnosticWarn",
  "DiagnosticInfo",
  "DiagnosticHint",
}

export class Source extends BaseSource<Params> {
  kind = "file";

  gather(args: {
    denops: Denops;
    context: Context;
    sourceParams: Params;
  }): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const res = await args.denops.eval(
          `luaeval("require'lsp_ddu'.diagnostic_all()")`,
        ) as {
          lnum: number;
          col: number;
          bufnr: number;
          severity: number;
          message: string;
        }[] | null;
        if (res === null) {
          return controller.close();
        }
        const tree = async () => {
          const items: Item<ActionData>[] = [];
          for await (const item of res) {
            const bufname = await fn.bufname(args.denops, item.bufnr);
            const word =
              `${bufname}:${item.lnum}:${item.col} ${item.message} [${
                TYPE_DIAGNOSTICS[item.severity]
              }]`;
            items.push({
              word: word,
              highlights: [{
                name: TYPE_DIAGNOSTICS[item.severity],
                "hl_group": HIGHLIGHT_DIAGNOSTICS[item.severity],
                col: 1,
                width: word.length,
              }],
              action: {
                path: bufname,
                lineNr: item.lnum + 1,
                col: item.col + 1,
              },
            });
          }
          return items;
        };
        controller.enqueue(await tree());
        controller.close();
      },
    });
  }
  params(): Params {
    return {
      path: "",
    };
  }
}
