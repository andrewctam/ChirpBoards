import { useRef, useEffect } from 'react';

const useScrollBottom = (action: () => Promise<void>) => {
    const fetching = useRef<boolean>(false);

    useEffect(() => {
        const handleScroll = async () => {
            let element = document.documentElement;
    
            if (!fetching.current && element.scrollHeight - element.scrollTop - element.clientHeight < 50) {    
                fetching.current = true;
                await action();
                fetching.current = false;
            }
        }

        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, [action]);

}

export default useScrollBottom;