import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../services/socket';

interface Point {
    x: number;
    y: number;
}

interface DrawOperation {
    id: string;
    userId: string;
    type: 'stroke';
    points: Point[];
    color: string;
    size: number;
}

const drawStroke = (ctx: CanvasRenderingContext2D, points: Point[], color: string, size: number) => {
    if (points.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
};

interface CanvasProps {
    color: string;
    size: number;
    tool: 'brush' | 'eraser';
}

export const Canvas: React.FC<CanvasProps> = ({ color, size, tool }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const currentPath = useRef<Point[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Resize handling is tricky in production (needs state save/restore). 
        // Here we just set once or reset clear.
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        socket.on('new-stroke', (op: DrawOperation) => {
            drawStroke(ctx, op.points, op.color, op.size);
        });

        socket.on('init-state', (data: { history: DrawOperation[] }) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            data.history.forEach(op => drawStroke(ctx, op.points, op.color, op.size));
        });

        socket.on('history-update', (history: DrawOperation[]) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            history.forEach(op => drawStroke(ctx, op.points, op.color, op.size));
        });

        return () => {
            socket.off('new-stroke');
            socket.off('init-state');
            socket.off('history-update');
        };
    }, []);

    const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        if ('touches' in e) {
            const touch = e.touches[0];
            return { x: touch.clientX, y: touch.clientY };
        }
        return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const point = getPoint(e);
        currentPath.current = [point];

        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
            ctx.fillStyle = tool === 'eraser' ? '#f0f0f0' : color;
            ctx.fill();
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) {
            const point = getPoint(e);
            socket.emit('cursor-move', { x: point.x, y: point.y });
            return;
        }

        const point = getPoint(e);
        const newPath = [...currentPath.current, point];

        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && currentPath.current.length > 0) {
            const lastPoint = currentPath.current[currentPath.current.length - 1];
            const effectiveColor = tool === 'eraser' ? '#f0f0f0' : color;
            ctx.strokeStyle = effectiveColor;
            ctx.lineWidth = size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(lastPoint.x, lastPoint.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
        }

        currentPath.current = newPath;
        socket.emit('cursor-move', { x: point.x, y: point.y });
    };

    const endDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        if (currentPath.current.length > 1) {
            socket.emit('draw', {
                points: currentPath.current,
                color: tool === 'eraser' ? '#f0f0f0' : color,
                size: size
            });
        }
        currentPath.current = [];
    };

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseOut={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
            className="block touch-none"
        />
    );
};
