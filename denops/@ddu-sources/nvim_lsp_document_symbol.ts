import { ActionData, BaseSource, Context, Denops, Item } from "./deps.ts";

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
          `luaeval("require'lsp_ddu'.document_symbol()")`,
        ) as {
          filename: string;
          col: number;
          lnum: number;
          text: string;
        }[] | null;
        if (res === null) {
          return controller.close();
        }
        const tree = async () => {
          const items: Item<ActionData>[] = [];
          for await (const item of res) {
            items.push({
              word: item.text,
              action: {
                path: item.filename,
                lineNr: item.lnum,
                col: item.col,
              },
            });
          }
          return items;
        };
        controller.enqueue(
          await tree(),
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
