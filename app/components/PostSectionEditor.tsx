'use client';

import React, { useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { HStack, VStack, Text, Spinner } from '@astryxdesign/core';
import { apiAdminMutate, resolveMediaUrl, type PostSection, type Media } from '../utils/api';
import { FiTrash, FiArrowUp, FiArrowDown, FiPlus, FiImage } from 'react-icons/fi';

interface InternalSection extends PostSection {
    uid: number;
}

interface PostSectionEditorProps {
    // Starting sections (e.g. when editing an existing post). Only read on mount —
    // remount with a new `key` to load different content.
    initialSections?: PostSection[];
    onChange: (sections: PostSection[]) => void;
}

let uidCounter = 1;
const nextUid = () => uidCounter++;

// --- Rich text toolbar -------------------------------------------------------

function ToolbarButton({ label, active, onClick, title }: {
    label: React.ReactNode;
    active?: boolean;
    onClick: () => void;
    title: string;
}) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer font-sans border ${active
                ? 'bg-accent text-on-accent border-accent'
                : 'bg-surface text-primary border-border hover:bg-muted/30'
                }`}
        >
            {label}
        </button>
    );
}

function Toolbar({ editor }: { editor: Editor | null }) {
    if (!editor) return null;
    return (
        <div className="flex flex-wrap gap-1.5 p-2 border-b border-border bg-muted/10 rounded-t-xl">
            <ToolbarButton title="Bold" label={<b>B</b>} active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
            <ToolbarButton title="Italic" label={<i>I</i>} active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
            <ToolbarButton title="Strikethrough" label={<s>S</s>} active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />
            <span className="w-px bg-border mx-1 self-stretch" />
            <ToolbarButton title="Heading 2" label="H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
            <ToolbarButton title="Heading 3" label="H3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
            <span className="w-px bg-border mx-1 self-stretch" />
            <ToolbarButton title="Bullet list" label="• List" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
            <ToolbarButton title="Numbered list" label="1. List" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
            <ToolbarButton title="Quote" label="&ldquo;&rdquo;" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
            <span className="w-px bg-border mx-1 self-stretch" />
            <ToolbarButton title="Undo" label="↺" onClick={() => editor.chain().focus().undo().run()} />
            <ToolbarButton title="Redo" label="↻" onClick={() => editor.chain().focus().redo().run()} />
        </div>
    );
}

// --- One section: rich text + image gallery ----------------------------------

function SectionCard({ section, index, total, onContentChange, onFilesChange, onRemove, onMove }: {
    section: InternalSection;
    index: number;
    total: number;
    onContentChange: (html: string) => void;
    onFilesChange: (files: string[]) => void;
    onRemove: () => void;
    onMove: (dir: -1 | 1) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const editor = useEditor({
        extensions: [StarterKit],
        content: section.content || '',
        immediatelyRender: false,
        shouldRerenderOnTransaction: true,
        editorProps: {
            attributes: {
                class: 'min-h-[140px] px-4 py-3 focus:outline-none text-primary text-sm font-sans leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-3 [&_blockquote]:italic [&_p]:mb-2'
            }
        },
        onUpdate: ({ editor }) => onContentChange(editor.getHTML())
    });

    const handleUpload = async (files: FileList) => {
        setUploading(true);
        setUploadError('');
        const uploaded: string[] = [];
        for (const file of Array.from(files)) {
            const formData = new FormData();
            formData.append('upload', file);
            const result = await apiAdminMutate<Media>('/admin/media', 'POST', formData);
            if (result.success && result.data?.filename) {
                uploaded.push(resolveMediaUrl(result.data.filename));
            } else {
                setUploadError(result.message || `Gagal mengunggah ${file.name}.`);
            }
        }
        if (uploaded.length > 0) {
            onFilesChange([...section.file, ...uploaded]);
        }
        setUploading(false);
    };

    return (
        <div className="border border-border rounded-xl bg-surface overflow-hidden">
            {/* Section header bar */}
            <HStack justify="between" align="center" className="px-4 py-2 bg-muted/20 border-b border-border">
                <Text type="supporting" color="secondary" weight="bold" className="text-xs uppercase tracking-wider font-sans">
                    Section {index + 1}
                </Text>
                <HStack gap={1}>
                    <button type="button" title="Naikkan section" disabled={index === 0} onClick={() => onMove(-1)}
                        className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-muted/30 disabled:opacity-30 cursor-pointer disabled:cursor-default">
                        <FiArrowUp size={14} />
                    </button>
                    <button type="button" title="Turunkan section" disabled={index === total - 1} onClick={() => onMove(1)}
                        className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-muted/30 disabled:opacity-30 cursor-pointer disabled:cursor-default">
                        <FiArrowDown size={14} />
                    </button>
                    {total > 1 && (
                        <button type="button" title="Hapus section" onClick={onRemove}
                            className="p-1.5 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer">
                            <FiTrash size={14} />
                        </button>
                    )}
                </HStack>
            </HStack>

            {/* Rich text editor */}
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />

            {/* Image gallery for this section */}
            <div className="px-4 py-3 border-t border-border bg-muted/5">
                <VStack gap={2} align="stretch">
                    {section.file.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                            {section.file.map((url, fileIdx) => (
                                <div key={fileIdx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={url} alt={`Gambar ${fileIdx + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        title="Hapus gambar"
                                        onClick={() => onFilesChange(section.file.filter((_, i) => i !== fileIdx))}
                                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <HStack gap={3} align="center">
                        <button
                            type="button"
                            disabled={uploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-primary hover:bg-muted/30 transition-colors cursor-pointer disabled:opacity-50 font-sans"
                        >
                            {uploading ? <Spinner size="sm" /> : <FiImage size={14} />}
                            {uploading ? 'Mengunggah…' : 'Tambah Gambar'}
                        </button>
                        <Text type="supporting" color="disabled" className="text-xs font-sans">
                            {section.file.length} gambar di section ini
                        </Text>
                    </HStack>
                    {uploadError && (
                        <Text type="supporting" className="text-xs text-red-400 font-sans">{uploadError}</Text>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                                handleUpload(e.target.files);
                                e.target.value = '';
                            }
                        }}
                    />
                </VStack>
            </div>
        </div>
    );
}

// --- The section list editor ---------------------------------------------------
// Owns internal state (with stable uids for editor instances) and reports plain
// [{ content, file }] sections upward. Remount with a new `key` to reset.

export default function PostSectionEditor({ initialSections, onChange }: PostSectionEditorProps) {
    const [sections, setSections] = useState<InternalSection[]>(() =>
        (initialSections && initialSections.length > 0 ? initialSections : [{ content: '', file: [] }])
            .map(s => ({ content: s.content, file: [...s.file], uid: nextUid() }))
    );

    const update = (next: InternalSection[]) => {
        setSections(next);
        onChange(next.map(({ content, file }) => ({ content, file })));
    };

    const patchSection = (uid: number, patch: Partial<PostSection>) => {
        update(sections.map(s => s.uid === uid ? { ...s, ...patch } : s));
    };

    const moveSection = (uid: number, dir: -1 | 1) => {
        const idx = sections.findIndex(s => s.uid === uid);
        const target = idx + dir;
        if (idx < 0 || target < 0 || target >= sections.length) return;
        const next = [...sections];
        [next[idx], next[target]] = [next[target], next[idx]];
        update(next);
    };

    return (
        <VStack gap={4} align="stretch">
            {sections.map((section, idx) => (
                <SectionCard
                    key={section.uid}
                    section={section}
                    index={idx}
                    total={sections.length}
                    onContentChange={(html) => patchSection(section.uid, { content: html })}
                    onFilesChange={(files) => patchSection(section.uid, { file: files })}
                    onRemove={() => update(sections.filter(s => s.uid !== section.uid))}
                    onMove={(dir) => moveSection(section.uid, dir)}
                />
            ))}
            <button
                type="button"
                onClick={() => update([...sections, { uid: nextUid(), content: '', file: [] }])}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border border-dashed border-border text-secondary hover:text-primary hover:border-accent hover:bg-muted/10 transition-colors cursor-pointer font-sans"
            >
                <FiPlus size={16} /> Tambah Section
            </button>
        </VStack>
    );
}
