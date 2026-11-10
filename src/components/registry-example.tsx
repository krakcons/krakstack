import type { ReactNode } from "react";
import { CodeBlock } from "@/components/ui/code-block";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { m } from "@/paraglide/messages";

/** Site-only example chrome. Not part of the distributed docs registry item. */
export const RegistryExample = ({
  children,
  source,
}: {
  children: ReactNode;
  source?: string | null;
}) => (
  <Tabs id="preview" defaultValue="preview" className="registry-example">
    <TabsList variant="line" aria-label={m.registry_docs_example()}>
      <TabsTrigger value="preview">{m.registry_docs_preview()}</TabsTrigger>
      {source ? (
        <TabsTrigger value="code">{m.registry_docs_code()}</TabsTrigger>
      ) : null}
    </TabsList>
    <TabsContent
      value="preview"
      keepMounted
      className="registry-example-preview bg-background rounded-lg border p-5 sm:p-8"
    >
      {children}
    </TabsContent>
    {source ? (
      <TabsContent
        value="code"
        className="max-h-[36rem] overflow-auto rounded-lg"
      >
        <CodeBlock code={source} language="tsx" />
      </TabsContent>
    ) : null}
  </Tabs>
);
