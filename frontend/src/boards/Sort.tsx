import { useState } from "react";

export enum SortMethod {
    New, Score
}

interface SortProps {
    sortMethod: SortMethod
    setSortMethod: (method: SortMethod) => void
}

function Sort(props: SortProps) {
    const [showMenu, setShowMenu] = useState(false);
    
    let name = ""
    switch (props.sortMethod) {
        case SortMethod.New:
            name = "New";
            break;
        case SortMethod.Score:
            name = "Score";
            break;
        default:
            return null;
    }

    return (
        <div className = "fixed bottom-2 left-2 z-50">
            {showMenu ? 
            <div>
                <div onClick = {() => {props.setSortMethod(SortMethod.New); setShowMenu(false)}} 
                    className = {`ml-auto mr-0 w-fit bg-black px-4 py-2 text-sm rounded-full my-2 cursor-pointer select-none ${props.sortMethod === SortMethod.New ? "text-rose-200" : "text-white"}`}>
                    New
                </div>
                <div onClick = {() => {props.setSortMethod(SortMethod.Score); setShowMenu(false)}} 
                    className = {`ml-auto mr-0 w-fit bg-black px-4 py-2 text-sm rounded-full my-2 cursor-pointer select-none ${props.sortMethod === SortMethod.Score ? "text-rose-200" : "text-white"}`}>
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

}


export default Sort;