import React from 'react';
import {
  RichDocumentEditor,
  type RichDocumentEditorProps,
} from '@/components/rich-editor';
import { FONT_FAMILIES, FONT_SIZES } from '@/components/rich-editor/ribbon/HomeTab';

export { FONT_FAMILIES, FONT_SIZES };
export type JiraRichEditorProps = RichDocumentEditorProps;

/**
 * JiraRichEditor: Upgraded Rich Document Editor blending Microsoft Word formatting,
 * Jira Code Blocks, Callouts, and inline drag-and-drop / Ctrl+V image pasting.
 * Backward compatible with existing JiraRichEditorProps.
 */
export function JiraRichEditor(props: JiraRichEditorProps) {
  return <RichDocumentEditor {...props} />;
}

export default JiraRichEditor;
