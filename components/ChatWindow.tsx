import { AArrowDown, BotMessageSquare, Minus, SendHorizontal, Square } from "lucide-react";
import { useState, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";

const ChatWindow = () => {
    let [open, setOpen] = useState(false);
    let [maximized, setMaximized] = useState(false);
    let [input, setInput] = useState("");
    let [messages, setMessages] = useState(Array.from(JSON.parse(localStorage.getItem("message") as string)));

    async function sendPrompt(message: string): Promise<void> {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": "AIzaSyDGw09XjT6c3D-kMm8tY6W2uiPXnMJHDBw"
                },
                body: JSON.stringify({
                    "contents": [
                        {
                            "parts": [
                                {
                                    "text": message,
                                }
                            ]
                        }
                    ]
                }),
            }
        );
        const data = await response.json();
        console.log(data?.candidates?.[0]?.content?.parts?.[0]?.text);
        setMessages((prev: string[]) => {
            let updated = [...prev, data?.candidates?.[0]?.content?.parts?.[0]?.text];
            localStorage.setItem("message", JSON.stringify(updated));
            return updated;
        });
        // return response.text
    }

    async function SendMessage(message: string): void {
        if (!message.trim()) return; // prevent empty messages
        setMessages((prev: string[]) => {
            let updated = [...prev, message];
            localStorage.setItem("message", JSON.stringify(updated));
            return updated;
        });
        setInput("");
        await sendPrompt(message);
    }

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Enter") {
                if (input.trim() !== "") {
                    SendMessage(input);
                }
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [input]);

    return (
        <>
            <div
                className="w-1/4 fixed min-w-90 h-150 right-10 top-50 chat-container flex-col rounded-lg border-2"
                style={{
                    backgroundColor: 'var(--card-background)',
                    borderColor: 'var(--border)',
                    display: open ? 'block' : 'none',
                    width: maximized ? 'calc(100% - 20px)' : '',
                    height: maximized ? '100vh' : '',
                    top: maximized ? '0' : '',
                    right: maximized ? '0' : '',
                }}
            >
                <div
                    className="rounded-t-lg p-3 text-xl flex"
                    style={{ backgroundColor: 'var(--primary)' }}
                >
                    <h1 className="w-4/5">Ask AI</h1>
                    <div className="flex flex-row items-center justify-around absolute right-3">
                        <button onClick={() => setOpen(false)} className="mr-4"><Minus /></button>
                        <button onClick={() => setMaximized(!maximized)}><Square /></button>
                    </div>
                </div>

                <div className="p-10 flex flex-col overflow-y-scroll" id="lol" style={{height: 'calc(100% - 110px)', alignItems: 'end'}}>
                    {messages.map((message, i) => (
                        <div key={i} className="mb-3 px-4 py-2 rounded-lg text-right border-2 w-fit" style={{ backgroundColor: 'var(--primary)', borderColor: 'var(--border)' }}>
                            {message as string}
                        </div>
                    ))}
                </div>

                <div
                    className="rounded-b-lg p-3 text-xl flex-row items-center justify-center absolute bottom-0 w-full border`-2"
                    style={{ backgroundColor: 'var(--primary)', borderColor: 'var(--border)' }}
                >
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask.."
                        className="w-10/11"
                    />

                    <button
                        className="absolute right-3"
                        onClick={() => SendMessage(input)}
                    >
                        <SendHorizontal />
                    </button>
                </div>
            </div>

            <div>
                <button
                    className="btn-primary fixed bottom-10 right-10"
                    onClick={() => setOpen(!open)}
                    style={{ display: open ? 'none' : "block" }}
                >
                    <BotMessageSquare />
                </button>
            </div>
        </>
    );
};

export default ChatWindow;