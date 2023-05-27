import { ActionData, BaseSource, Context, Denops, Item } from "./deps.ts";

type Params = Record<never, never>;

export class Source extends BaseSource<Params> {
  kind = "file";

  gather(args: {
    denops: Denops;
    context: Context;
  }): ReadableStream<Item<ActionData>[]> {
    const { denops, context } = args;

    return new ReadableStream({
      async start(controller) {
        const res = await denops.eval(
          `luaeval("require'lsp_ddu'.references(${context.bufNr}, ${context.winId})")`,
        ) as { col: number; lnum: number; filename: string }[] | null;
        if (res === null) {
          return controller.close();
        }
        const items = res.map((item) => {
          const { filename: path, lnum: lineNr } = item;
          const col = item.col + 1;
          return {
            word: path,
            display: `${path}:${lineNr}:${col}`,
            action: {
              path,
              lineNr,
              col,
            },
          };
        });
        controller.enqueue(items);
        controller.close()
      },
    });
  }
  params(): Params {
    return {
      path: "",
    };
  }
}
