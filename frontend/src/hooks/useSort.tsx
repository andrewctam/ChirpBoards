import { useEffect, useState } from "react";

export enum SortMethod {
    New, Score
}

export enum SortDirection {
    Ascending, Descending
}

function useSort(doneFetching: boolean, 
                fetchFunction: () => void,
                resetFunction: () => void): [sortMethod: string, sortDirection: string, sortBubble: JSX.Element] {
                    
    const [showMenu, setShowMenu] = useState(false);
    
    const [sortMethod, setSortMethod] = useState<SortMethod>(SortMethod.New);
    const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.Descending);
    const [reload, setReload] = useState(false);


    useEffect(() => {
        if (doneFetching) {
            resetFunction() //reset the feeds
            setReload(true) //trigger the below useEffect
        }
    }, [sortMethod, sortDirection])

    useEffect(() => {
        if (reload) {
            setReload(false)
            fetchFunction(); //fetch new sorted feeds
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
            <div className = "flex items-end">
                <div>
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

                        <div className = "text-rose-200 inline ml-1">
                            {name}
                        </div>
                    </div>
                </div>

                <div className = "mx-1 bg-black text-white text-xs p-2 px-3 select-none cursor-pointer rounded-full w-fit h-fit" 
                    onClick = {() => {
                        if (sortDirection === SortDirection.Ascending)
                            setSortDirection(SortDirection.Descending);
                        else
                            setSortDirection(SortDirection.Ascending);
                    }}>

                    {sortDirection === SortDirection.Ascending ? "▲" : "▼"}
                </div>
            </div>
        </div>
    )

    let methodName = "postDate";
    
    if (sortMethod === SortMethod.Score)
        methodName = "score";

    let directionName = "descending";
    if (sortDirection === SortDirection.Ascending)
        directionName = "ascending"


    return [methodName, directionName, sortBubble]
}


export default useSort;