"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Panel } from "@/components/admin/ui";
import { FieldEditor } from "@/components/admin/fields/field-editor";
import { useAction } from "@/components/admin/use-action";
import { PAGE_FIELDS, SETTINGS_FIELDS } from "@/config/fields";
import { savePageAction, saveSettingAction } from "@/lib/actions/content";
import type { PageKey } from "@/lib/validations/pages";
import type { SiteSettingKey } from "@/lib/validations/settings";

/* --------------------------------- Pages --------------------------------- */

type PageState = {
  key: PageKey;
  meta: { title: string; seo_title: string; seo_description: string; is_published: boolean };
  content: Record<string, unknown>;
};

const PAGE_PATHS: Record<PageKey, string> = { about: "/about", projects: "/projects", contact: "/contact" };

function PageForm({ page }: { page: PageState }) {
  const [meta, setMeta] = useState(page.meta);
  const [content, setContent] = useState(page.content);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const { run, pending } = useAction();
  const config = PAGE_FIELDS[page.key];

  const save = () =>
    run(
      async () => {
        const result = await savePageAction(page.key, { meta, content });
        setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
        return result;
      },
      { onSuccess: () => setDirty(false) },
    );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Panel title={`${config.label} content`} description={config.description} className="lg:col-span-2">
        <FieldEditor
          fields={config.fields}
          value={content}
          errors={errors}
          onChange={(v) => {
            setContent(v);
            setDirty(true);
          }}
        />
      </Panel>
      <div className="space-y-6">
        <Panel title="Page settings">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor={`${page.key}-title`}>Page title</Label>
              <Input
                id={`${page.key}-title`}
                value={meta.title}
                maxLength={200}
                onChange={(e) => {
                  setMeta({ ...meta, title: e.target.value });
                  setDirty(true);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${page.key}-seo-title`}>SEO title</Label>
              <Input
                id={`${page.key}-seo-title`}
                value={meta.seo_title}
                maxLength={200}
                onChange={(e) => {
                  setMeta({ ...meta, seo_title: e.target.value });
                  setDirty(true);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${page.key}-seo-description`}>SEO description</Label>
              <Textarea
                id={`${page.key}-seo-description`}
                rows={3}
                maxLength={320}
                value={meta.seo_description}
                onChange={(e) => {
                  setMeta({ ...meta, seo_description: e.target.value });
                  setDirty(true);
                }}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor={`${page.key}-published`}>Published</Label>
              <Switch
                id={`${page.key}-published`}
                checked={meta.is_published}
                onCheckedChange={(v) => {
                  setMeta({ ...meta, is_published: v });
                  setDirty(true);
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={save} disabled={!dirty || pending}>
                {pending && <Loader2 className="animate-spin" />}
                Save page
              </Button>
              <Button asChild variant="outline" size="icon">
                <a href={PAGE_PATHS[page.key]} target="_blank" rel="noopener noreferrer" aria-label="View page">
                  <ExternalLink />
                </a>
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function PagesEditor({ pages, initial }: { pages: PageState[]; initial?: string }) {
  return (
    <Tabs defaultValue={pages.some((p) => p.key === initial) ? initial : pages[0]?.key} className="gap-6">
      <TabsList>
        {pages.map((p) => (
          <TabsTrigger key={p.key} value={p.key}>
            {PAGE_FIELDS[p.key].label}
          </TabsTrigger>
        ))}
      </TabsList>
      {pages.map((p) => (
        <TabsContent key={p.key} value={p.key}>
          <PageForm page={p} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

/* ------------------------------- Settings -------------------------------- */

function SettingForm({ settingKey, initial }: { settingKey: SiteSettingKey; initial: Record<string, unknown> }) {
  const [value, setValue] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const { run, pending } = useAction();
  const config = SETTINGS_FIELDS[settingKey];

  return (
    <Panel
      title={config.label}
      description={config.description}
      actions={
        <Button
          size="sm"
          disabled={!dirty || pending}
          onClick={() =>
            run(
              async () => {
                const result = await saveSettingAction(settingKey, value);
                setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
                return result;
              },
              { onSuccess: () => setDirty(false) },
            )
          }
        >
          {pending && <Loader2 className="animate-spin" />}
          Save
        </Button>
      }
    >
      <div className="max-w-2xl">
        <FieldEditor
          fields={config.fields}
          value={value}
          errors={errors}
          onChange={(v) => {
            setValue(v);
            setDirty(true);
          }}
        />
      </div>
    </Panel>
  );
}

export function SettingsEditor({ settings }: { settings: Record<SiteSettingKey, Record<string, unknown>> }) {
  const keys = Object.keys(SETTINGS_FIELDS) as SiteSettingKey[];
  return (
    <Tabs defaultValue="brand" className="gap-6">
      <TabsList className="h-auto flex-wrap">
        {keys.map((key) => (
          <TabsTrigger key={key} value={key}>
            {SETTINGS_FIELDS[key].label}
          </TabsTrigger>
        ))}
      </TabsList>
      {keys.map((key) => (
        <TabsContent key={key} value={key}>
          <SettingForm settingKey={key} initial={settings[key]} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
