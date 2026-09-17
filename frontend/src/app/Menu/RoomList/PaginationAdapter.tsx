import type {HTMLAttributes, ReactElement} from "react";
import {useState} from "react";
import {Pagination} from "@/comp/Pagination/Pagination.tsx";

export interface PaginationAdapterProps extends HTMLAttributes<HTMLDivElement> {
    nextToken: string | null
    prevToken: string | null
    onTokenChange: (token: string) => void
}

export function PaginationAdapter({nextToken, prevToken, onTokenChange, ...rest}: PaginationAdapterProps): ReactElement {
    const [index, setIndex] = useState(0);
    const hasNext = nextToken != null;
    const hasPrev = prevToken != null;
    const pageLabel = `PAGE ${index + 1}/${index + 1 + (hasNext ? 1 : 0)}`;

    const handlePrevPage = () => {
        if (!prevToken) return;
        onTokenChange(prevToken);
        setIndex((current) => Math.max(0, current - 1));
    };
    const handleNextPage = () => {
        if (!nextToken) return;
        onTokenChange(nextToken);
        setIndex((current) => current + 1);
    };

    return (
        <Pagination
            pageLabel={pageLabel}
            onPrev={handlePrevPage}
            onNext={handleNextPage}
            prevDisabled={!hasPrev}
            nextDisabled={!hasNext}
            className="mx-4 mb-3"
            {...rest}
        />

    )
}
