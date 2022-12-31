import {useEffect} from 'react';
const useScrollBottom = (action: () => void) => {

    const handleScroll = () => {
        let element = document.documentElement;

        if (element.scrollHeight - element.scrollTop === element.clientHeight) {
            action();
        }
    }

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll, action]);

}

export default useScrollBottom;