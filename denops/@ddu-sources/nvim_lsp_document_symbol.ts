import {
  BaseSource,
  Context,
  Item,
} from "https://deno.land/x/ddu_vim@v0.1.0/types.ts#^";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v0.1.0/deps.ts#^";
import { ActionData } from "https://deno.land/x/ddu_kind_file@v0.1.0/file.ts#^";

type Params = Record<never, never>;

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
          `luaeval("require'lsp_ddu'.document_symbol()")`,
        ) as {
          filename: string;
          col: number;
          lnum: number;
          text: string;
        }[] | null;
        if (items === null) {
          return controller.close();
        }
        controller.enqueue(
          await Promise.all(items.map(async (item, _) => {
            return {
              word: item.text,
              abbr: `${item.lnum}:${item.col} ${item.text} ${await fn.getline(
                args.denops,
                item.lnum,
              )}`,
              action: {
                path: item.filename,
                lineNr: item.lnum,
                col: item.col,
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
