import React from 'react';
import {
  RichDocumentViewer,
  type RichDocumentViewerProps,
} from '@/components/rich-editor';

export type JiraRichViewerProps = RichDocumentViewerProps;

/**
 * JiraRichViewer: Upgraded Document Viewer with XSS sanitization, interactive Jira
 * code block header & copy button, formatted callouts, responsive tables, and
 * click-to-zoom image lightbox. Backward compatible with existing JiraRichViewerProps.
 */
export function JiraRichViewer(props: JiraRichViewerProps) {
  return <RichDocumentViewer {...props} />;
}

export default JiraRichViewer;
