import {
  BaseSource,
  Context,
  Item,
} from "https://deno.land/x/ddu_vim@v0.1.0/types.ts#^";
import { Denops } from "https://deno.land/x/ddu_vim@v0.1.0/deps.ts#^";
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
          `luaeval("require'lsp_ddu'.references()")`,
        ) as { col: number; lnum: number; filename: string }[] | null;
        if (items === null) {
          return controller.close();
        }
        controller.enqueue(items.map((item, _) => {
          return {
            word: item["filename"],
            action: {
              path: item.filename,
              lineNr: item.lnum,
              col: item.col,
            },
          };
        }));
      },
    });
  }
  params(): Params {
    return {
      path: "",
    };
  }
}
