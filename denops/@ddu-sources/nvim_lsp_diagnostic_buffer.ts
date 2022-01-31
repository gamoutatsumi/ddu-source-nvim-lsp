import {
  BaseSource,
  Context,
  Item,
} from "https://deno.land/x/ddu_vim@v0.4.0/types.ts#^";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v0.4.0/deps.ts#^";
import { ActionData } from "https://deno.land/x/ddu_kind_file@v0.1.0/file.ts#^";

type Params = Record<never, never>;

enum TYPE_DIAGNOSTICS {
  "Error",
  "Warning",
  "Information",
  "Hint",
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
        const items = await args.denops.eval(
          `luaeval("require'lsp_ddu'.diagnostic_buffer()")`,
        ) as {
          lnum: number;
          col: number;
          bufnr: number;
          severity: number;
          message: string;
        }[] | null;
        if (items === null) {
          return controller.close();
        }
        controller.enqueue(
          await Promise.all(items.map(async (item, _) => {
            const filename = await fn.bufname(args.denops, item.bufnr);
            return {
              word: `${TYPE_DIAGNOSTICS[item.severity][0]} ${filename}:${item.lnum}:${item.col} ${item.message}`,
              action: {
                path: filename,
                lnum: item.lnum + 1,
                col: item.col + 1,
                type: TYPE_DIAGNOSTICS[item.severity],
              },
            };
          })),
        );
      },
    });
  }
  params(): Params {
    return {
      path: "",
    };
  }
}
