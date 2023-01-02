import { useEffect, useState } from "react";

export enum SortMethod {
    New, Score
}


function useSort(doneFetching: boolean, 
                fetchFunction: () => void, 
                resetFunction: () => void): [sortMethod: string, sortBubble: JSX.Element] {
                    
    const [showMenu, setShowMenu] = useState(false);
    
    const [sortMethod, setSortMethod] = useState<SortMethod>(SortMethod.New);
    const [reload, setReload] = useState(false);


    useEffect(() => {
        if (doneFetching) {
            resetFunction()
            setReload(true)
        }
    }, [sortMethod])

    useEffect(() => {
        if (reload) {
            setReload(false)
            fetchFunction();
        }
    }, [reload])

    let name = ""
    switch (sortMethod) {
        case SortMethod.New:
            name = "New";
            break;
        case SortMethod.Score:
            name = "Score";
            break;
        default:
            break;
    }

    const sortBubble = (
        <div className = "fixed bottom-2 right-2 z-50">
            {showMenu ? 
            <div>
                <div onClick = {() => {setSortMethod(SortMethod.New); setShowMenu(false)}} 
                    className = {`ml-auto mr-0 w-fit bg-black px-4 py-2 text-xs rounded-full my-2 cursor-pointer select-none ${sortMethod === SortMethod.New ? "text-rose-200" : "text-white"}`}>
                    New
                </div>
                <div onClick = {() => {setSortMethod(SortMethod.Score); setShowMenu(false)}} 
                    className = {`ml-auto mr-0 w-fit bg-black px-4 py-2 text-xs rounded-full my-2 cursor-pointer select-none ${sortMethod === SortMethod.Score ? "text-rose-200" : "text-white"}`}>
                    Score
                </div>
            </div>
            : null}

            
            <div className = "px-4 py-2 rounded-full bg-black text-white text-xs select-none cursor-pointer" onClick = {() => setShowMenu(!showMenu)}>
                Sorting by: 
                <div className = "text-rose-200 inline mx-1">
                    {name}
                </div>
                ▲
            </div>
        </div>
    )

    let sort = "postDate";
        if (sortMethod === SortMethod.New)
            sort = "postDate";
        else if (sortMethod === SortMethod.Score)
            sort = "score";

    return [sort, sortBubble]
}


export default useSort;