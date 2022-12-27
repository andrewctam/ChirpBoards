import { useState } from "react"


interface VoteProps {
    
}

function Vote() {

    const [votes, setVotes] = useState(10)

    return (
        <div className="absolute -right-2 my-auto h-fit top-0 bottom-0 bg-gray-200 border border-black/20 py-1 px-2 rounded-xl text-center text-xs">
            <button className="" onClick = {() => {setVotes(votes + 1)}}>
                {String.fromCharCode(9650)}
            </button>

            <div> {votes} </div>

            <button className="" onClick = {() => {setVotes(votes - 1)}}>
                {String.fromCharCode(9660)}
            </button>
        </div>
    )

}

export default Vote