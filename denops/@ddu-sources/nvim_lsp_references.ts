import {
  BaseSource,
  Context,
  Item,
} from "https://deno.land/x/ddu_vim@v0.12.2/types.ts#^";
import { Denops } from "https://deno.land/x/ddu_vim@v0.12.2/deps.ts#^";
import { ActionData } from "https://deno.land/x/ddu_kind_file@v0.2.0/file.ts#^";

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
        const res = await args.denops.eval(
          `luaeval("require'lsp_ddu'.references()")`,
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
                col: item.col,
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
