import React from 'react';
import Button from '../atoms/Button';

const ChatWindow = ({
    selectedConvo,
    thread,
    user,
    loading,
    sending,
    messageText,
    setMessageText,
    onSendMessage,
    scrollRef
}) => {

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        return isToday
            ? date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
            : date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    };

    if (!selectedConvo) {
        return (
            <div className="chat-main flex flex-col items-center justify-center bg-slate-50 h-full text-center p-8">
                <div className="text-6xl mb-4 opacity-20">💬</div>
                <h2 className="text-2xl font-bold text-slate-700 mb-2">Tus Mensajes</h2>
                <p className="text-slate-500 max-w-md">Selecciona una conversación de la lista para empezar a chatear o busca un contacto para iniciar un nuevo chat.</p>
            </div>
        );
    }

    return (
        <div className="chat-main flex flex-col h-full bg-white relative">
            {/* Header */}
            <div className="chat-header flex items-center gap-4 p-4 border-b border-slate-100 bg-white z-10 shadow-sm">
                <div className="convo-avatar w-10 h-10 text-lg">
                    {selectedConvo.other_display_name ? selectedConvo.other_display_name[0].toUpperCase() : '?'}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 m-0 leading-tight">{selectedConvo.other_display_name || selectedConvo.other_username}</h3>
                    <small className="text-slate-500 text-xs">{selectedConvo.subject || 'Conversación activa'}</small>
                </div>
            </div>

            {/* Messages Area */}
            <div className="chat-messages flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50" ref={scrollRef}>
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="loading-spinner"></div>
                    </div>
                ) : thread.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-50">
                        <div className="text-4xl">👋</div>
                        <p>¡Dile hola!</p>
                    </div>
                ) : (
                    thread.map(msg => (
                        <div key={msg.id} className={`message-bubble ${msg.sender_id === user?.user_id ? 'sent' : 'received'}`}>
                            <div className="bubble-content">
                                {msg.message}
                                <span className="bubble-time">{formatDate(msg.created_at)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <form className="chat-input-area p-4 bg-white border-t border-slate-100 flex gap-2 items-center" onSubmit={onSendMessage}>
                <div className="chat-input-wrapper flex-1 relative">
                    <input
                        type="text"
                        placeholder="Escribe un mensaje aquí..."
                        className="w-full py-3 px-4 rounded-full bg-slate-100 border-none focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        disabled={sending}
                    />
                </div>
                <Button
                    type="submit"
                    className="w-12 h-12 rounded-full p-0 flex items-center justify-center shadow-lg hover:shadow-xl transition-transform active:scale-95"
                    disabled={sending || !messageText.trim()}
                    variant="primary"
                >
                    {sending ? <div className="loading-spinner w-4 h-4 border-2 border-white"></div> : '➤'}
                </Button>
            </form>
        </div>
    );
};

export default ChatWindow;
