import React, { useRef, useEffect, useState } from 'react';
import { useSocketContext } from '../context/SocketContext';
import { EraserIcon, PencilIcon, TrashIcon, XIcon } from 'lucide-react';

const Whiteboard = ({ roomId, onClose, isAnnotation = false }) => {
    const canvasRef = useRef(null);
    const socket = useSocketContext();
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(2);
    const [tool, setTool] = useState('pen'); // pen, eraser

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set canvas size to match parent
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Socket listeners
        if (socket) {
            socket.emit('join-room', roomId);

            const handleDraw = (data) => {
                const ctx = canvas.getContext('2d');
                const { x0, y0, x1, y1, color, width, type } = data;

                // Convert relative coords to absolute
                const w = canvas.width;
                const h = canvas.height;

                ctx.beginPath();
                if (type === 'eraser') {
                    ctx.globalCompositeOperation = 'destination-out';
                } else {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.strokeStyle = color;
                }
                ctx.lineWidth = width;
                ctx.moveTo(x0 * w, y0 * h);
                ctx.lineTo(x1 * w, y1 * h);
                ctx.stroke();
                ctx.closePath();

                // Reset composite operation
                ctx.globalCompositeOperation = 'source-over';
            };

            const handleClear = () => {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            };

            socket.on('draw', handleDraw);
            socket.on('clear-canvas', handleClear);

            return () => {
                socket.off('draw', handleDraw);
                socket.off('clear-canvas', handleClear);
                window.removeEventListener('resize', resizeCanvas);
                // leave room? socket.emit('leave-room', roomId);
            };
        }
    }, [socket, roomId]);

    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / canvas.width,
            y: (e.clientY - rect.top) / canvas.height
        };
    };

    const startDrawing = (e) => {
        setIsDrawing(true);
        const { x, y } = getPos(e);
        canvasRef.current.lastX = x;
        canvasRef.current.lastY = y;
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const { x, y } = getPos(e);
        const lastX = canvasRef.current.lastX;
        const lastY = canvasRef.current.lastY;

        // Draw locally
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.beginPath();
        if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = 10;
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
        }

        ctx.moveTo(lastX * w, lastY * h);
        ctx.lineTo(x * w, y * h);
        ctx.stroke();
        ctx.closePath();
        ctx.globalCompositeOperation = 'source-over';

        // Emit
        if (socket) {
            socket.emit('draw', {
                roomId,
                data: {
                    x0: lastX,
                    y0: lastY,
                    x1: x,
                    y1: y,
                    color,
                    width: tool === 'eraser' ? 10 : lineWidth,
                    type: tool
                }
            });
        }

        canvasRef.current.lastX = x;
        canvasRef.current.lastY = y;
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (socket) {
            socket.emit('clear-canvas', roomId);
        }
    };

    return (
        <div className={`absolute inset-0 z-50 pointer-events-auto ${isAnnotation ? 'bg-transparent' : 'bg-white'}`}>
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                className="cursor-crosshair w-full h-full touchscreen-touch-action-none"
            />

            {/* Toolbar */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-4">
                <button
                    onClick={() => setTool('pen')}
                    className={`p-2 rounded-full ${tool === 'pen' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                >
                    <PencilIcon size={20} />
                </button>

                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    disabled={tool === 'eraser'}
                    className="w-8 h-8 rounded-full cursor-pointer overflow-hidden border-0 p-0"
                />

                <button
                    onClick={() => setTool('eraser')}
                    className={`p-2 rounded-full ${tool === 'eraser' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                >
                    <EraserIcon size={20} />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-2"></div>

                <button
                    onClick={clearCanvas}
                    className="p-2 rounded-full hover:bg-red-50 text-red-500"
                    title="Clear All"
                >
                    <TrashIcon size={20} />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-2"></div>

                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                >
                    <XIcon size={20} />
                </button>
            </div>
        </div>
    );
};

export default Whiteboard;
