import { UIBlock, SDUIAction } from '../types';

export default function Button({ block, onAction }: { block: UIBlock; onAction?: (action: SDUIAction) => void }) {

    return (
        <button
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            onClick={() => block.actions?.forEach(action => onAction?.(action))}
        >

            {block.data?.label || block.content || "Click Me"}
        </button>
    );
}
