import matter from 'gray-matter';
import { marked } from 'marked';
import type { ParsedMarkdownIdea, IdeaStage, IdeaStatus, Horizon } from '../types';

const KNOWN_FIELDS = ['title', 'category', 'owner', 'stage', 'status', 'horizon', 'tags', 'created'];

export function parseIdeaMarkdown(raw: string, sourceFile: string): ParsedMarkdownIdea {
  const { data, content } = matter(raw);

  const extra: Record<string, unknown> = {};
  for (const key of Object.keys(data)) {
    if (!KNOWN_FIELDS.includes(key)) extra[key] = data[key];
  }

  return {
    title:        data.title        ?? inferTitleFromContent(content) ?? fileBasename(sourceFile),
    category:     data.category     ?? undefined,
    owner:        data.owner        ?? undefined,
    stage:        data.stage        as IdeaStage | undefined,
    status:       data.status       as IdeaStatus | undefined,
    horizon:      data.horizon      as Horizon | undefined,
    tags:         Array.isArray(data.tags) ? data.tags.map(String) : [],
    created:      data.created ? String(data.created) : undefined,
    body:         marked(content) as string,
    raw,
    source_file:  sourceFile,
    extra_fields: extra,
  };
}

function inferTitleFromContent(content: string): string | null {
  const match = content.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : null;
}

function fileBasename(filePath: string): string {
  return filePath.split(/[\\/]/).pop()?.replace(/\.md$/i, '') ?? filePath;
}
