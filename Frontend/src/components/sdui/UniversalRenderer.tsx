// Static Imports to fix Type Errors


import Button from './elements/Button';
import Image from './elements/Image';
import InputText from './elements/InputText';
import ProductCard from './elements/ProductCard';
import Text from './elements/Text';
import Carousel from './layouts/Carousel';
import Container from './layouts/Container';
import FormContainer from './layouts/FormContainer';
import { UIBlock, SDUIAction } from './types';

export const UniversalRenderer = ({ block, onAction }: { block: UIBlock; onAction?: (action: SDUIAction) => void }) => {


    if (!block) return null;

    switch (block.type) {
        // --- Layouts ---
        case 'container':
            return <Container block={block}><RecursiveChildren blocks={block.children} onAction={onAction} /></Container>;


        case 'carousel':
            return <Carousel block={block} onAction={onAction} />; // Carousel handles its own items rendering usually


        case 'form_container':
            return <FormContainer block={block}><RecursiveChildren blocks={block.children} onAction={onAction} /></FormContainer>;


        // --- Elements ---
        case 'text':
            return <Text block={block} />;

        case 'image':
            return <Image block={block} />;

        case 'button':
            return <Button block={block} onAction={onAction} />;


        case 'input_text':
            return <InputText block={block} />;

        case 'card_product':
            return <ProductCard block={block} onAction={onAction} />;


        default:
            console.warn(`Unknown SDUI Type: ${block.type}`);
            return null;
    }
};

const RecursiveChildren = ({ blocks, onAction }: { blocks?: UIBlock[]; onAction?: (action: SDUIAction) => void }) => {

    if (!blocks) return null;
    return (
        <>
            {blocks.map((child, idx) => (
                <UniversalRenderer key={idx} block={child} onAction={onAction} />
            ))}

        </>
    );
};

export default UniversalRenderer;
