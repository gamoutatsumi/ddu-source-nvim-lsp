import {
  BaseSource,
  Context,
  Item,
} from "https://deno.land/x/ddu_vim@v2.8.4/types.ts#^";
import { Denops } from "https://deno.land/x/ddu_vim@v2.8.4/deps.ts#^";
import { ActionData } from "https://deno.land/x/ddu_kind_file@v0.4.0/file.ts";

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
      },
    });
  }
  params(): Params {
    return {
      path: "",
    };
  }
}
