"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Quote, Undo, Redo, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef, useState, useEffect } from 'react';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    editable?: boolean;
    className?: string; // Additional container classes
}

export const RichTextEditor = ({ content, onChange, placeholder = "Start typing...", editable = true, className }: RichTextEditorProps) => {

    const editor = useEditor({
        extensions: [
            StarterKit,
            BubbleMenuExtension,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-400 underline cursor-pointer',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full rounded-lg border border-slate-700 my-4',
                },
            }),
            Placeholder.configure({
                placeholder: placeholder,
                emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-slate-500 before:h-0 before:float-left before:pointer-events-none',
            }),
        ],
        content: content,
        editable: editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] p-4',
            },
        },
    });

    // Sync content if it changes externally (e.g. from DB load)
    useEffect(() => {
        if (editor && content && editor.getHTML() !== content) {
            // Only set content if it's drastically different to avoid cursor jumps
            // For simplicity in this version, we trust initial load or controlled via key
        }
    }, [content, editor]);


    if (!editor) {
        return null;
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        // cancelled
        if (url === null) {
            return;
        }

        // empty
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        // update
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };


    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const addImage = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axiosInstance.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                editor.chain().focus().setImage({ src: res.data.url }).run();
                toast.success("Image uploaded!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Upload failed");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className={cn("border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50 backdrop-blur-sm", className)}>

            {/* --- TOOLBAR --- */}
            {editable && (
                <div className="flex items-center gap-1 p-2 border-b border-slate-800 bg-slate-900/50 flex-wrap">
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                        icon={Bold}
                    />
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive('italic')}
                        icon={Italic}
                    />
                    <div className="w-px h-6 bg-slate-800 mx-1" />

                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        isActive={editor.isActive('heading', { level: 1 })}
                        icon={Heading1}
                    />
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        isActive={editor.isActive('heading', { level: 2 })}
                        icon={Heading2}
                    />
                    <div className="w-px h-6 bg-slate-800 mx-1" />

                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        isActive={editor.isActive('bulletList')}
                        icon={List}
                    />
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        isActive={editor.isActive('orderedList')}
                        icon={ListOrdered}
                    />
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        isActive={editor.isActive('blockquote')}
                        icon={Quote}
                    />
                    <div className="w-px h-6 bg-slate-800 mx-1" />

                    <ToolbarBtn onClick={setLink} isActive={editor.isActive('link')} icon={LinkIcon} />
                    <ToolbarBtn onClick={addImage} isActive={false} icon={ImageIcon} />

                    <div className="flex-grow" />

                    <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} isActive={false} icon={Undo} />
                    <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} isActive={false} icon={Redo} />
                </div>
            )}



            {/* --- EDITOR CONTENT --- */}
            <div className="min-h-[400px] w-full text-slate-300">
                <EditorContent editor={editor} />
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />
        </div>
    );
};


const ToolbarBtn = ({ onClick, isActive, icon: Icon, size = "md" }: any) => (
    <button
        type="button" // Prevent form submission
        onClick={onClick}
        className={cn(
            "p-2 rounded-md transition-colors hover:bg-slate-800 text-slate-400 hover:text-white",
            isActive && "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30",
            size === "sm" ? "p-1.5" : "p-2"
        )}
    >
        <Icon className={cn("w-4 h-4", size === "sm" && "w-3 h-3")} />
    </button>
);
