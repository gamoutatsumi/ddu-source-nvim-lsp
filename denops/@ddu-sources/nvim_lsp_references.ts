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
        const tree = async () => {
          const items: Item<ActionData>[] = [];
          for await (const item of res) {
            items.push({
              word: item["filename"],
              action: {
                path: item.filename,
                lineNr: item.lnum,
                col: item.col + 1,
              },
            });
          }
          return items;
        };
        controller.enqueue(await tree());
      },
    });
  }
  params(): Params {
    return {
      path: "",
    };
  }
}
