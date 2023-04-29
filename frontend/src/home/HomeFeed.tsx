import { useContext, useEffect, useState } from "react";
import FeedButton from "./FeedButton";
import Chirp, { Rechirper } from "./Chirp";
import { UserContext } from "../App";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PostPayload } from "../App";
import useScrollBottom from "../hooks/useScrollBottom";
import useSort from "../hooks/useSort";
import ChirpPlaceholder from "../placeholders/ChirpPlaceholder";

export enum Feed { None, Trending, All, Following }

interface HomeFeedProps {
    refreshFollowing: boolean;
    setRefreshFollowing: (refresh: boolean) => void;
} 

const HomeFeed = (props: HomeFeedProps) => {
    const [selectedFeed, setSelectedFeed] = useState<Feed>(Feed.None)

    const [allFeed, setAllFeed] = useState<JSX.Element[]>([]);
    const [trendingFeed, setTrendingFeed] = useState<JSX.Element[]>([]);
    const [followingFeed, setFollowingFeed] = useState<JSX.Element[]>([]);

    const [allPageNum, setAllPageNum] = useState(0);
    const [trendingPageNum, setTrendingPageNum] = useState(0);
    const [followingPageNum, setFollowingPageNum] = useState(0);

    const [allHasNextPage, setAllHasNextPage] = useState(true);
    const [trendingHasNextPage, setTrendingHasNextPage] = useState(true);
    const [followingHasNextPage, setFollowingHasNextPage] = useState(true);

    const [doneFetching, setDoneFetching] = useState(false);
    const [followingOthers, setFollowingOthers] = useState(false);
    const userInfo = useContext(UserContext);
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();

    const switchFeeds = (feed: Feed) => {
        setSelectedFeed(feed);
        setSearchParams({feed: 
            feed === Feed.All ?      "all" : 
            feed === Feed.Trending ? "trending" :
                                     "following" 
        });
    }

    useEffect(() => {
        //get initial chirps when the selected feed changes

        //inital page load, set the feed in the hook below
        if (selectedFeed === Feed.None) 
            return;

        if ((selectedFeed === Feed.All && allFeed.length === 0) ||
            (selectedFeed === Feed.Trending && trendingFeed.length === 0)) {
                getChirps(true);
        } else if (selectedFeed === Feed.Following && (followingFeed.length === 0 || props.refreshFollowing)) {
            if (props.refreshFollowing)
                    props.setRefreshFollowing(false);

                getChirps(true);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFeed, props.refreshFollowing])

    useEffect(() => {
        //initial page load
        switch (searchParams.get("feed")) {
            case "all":
                setSelectedFeed(Feed.All)
                return;
            case "trending":
                setSelectedFeed(Feed.Trending)
                return;
            case "following":
                setSelectedFeed(Feed.Following)
                return;
            default:
                setSelectedFeed(Feed.All);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps 
    }, [])


    const getChirps = async (reset = false) => {
        let type = "";
        let pageNum = 0

        if (selectedFeed === Feed.Following) {
            if (userInfo.state.username === "") {
                navigate(`/signin`)
                return;
            }
            if (!followingHasNextPage && !reset) {
                return;
            }

            type = "followingPosts";
            pageNum = followingPageNum;

        } else if (selectedFeed === Feed.Trending) {
            if (!trendingHasNextPage && !reset) {
                return;
            }

            type = "trendingPosts";
            pageNum = trendingPageNum;
        } else if (selectedFeed === Feed.All) {
            if (!allHasNextPage && !reset) {
                return;
            }

            type = "allPosts";
            pageNum = allPageNum;
        } else {
            return;
        }

        if (reset) {
            pageNum = 0;
        }

        let usernameField = "";
        if (selectedFeed === Feed.Following) {
            usernameField = `, username: "${userInfo.state.username}"`
        } else if (userInfo.state.username)
            usernameField = `, relatedUsername: "${userInfo.state.username}"`

        let sortField = "";
        if (selectedFeed === Feed.All || selectedFeed === Feed.Following)
            sortField = `, sortMethod: "${sortMethod}", sortDirection: "${sortDirection}"`;

        setDoneFetching(false);
        const url = import.meta.env.DEV ? import.meta.env.VITE_DEV_URL : import.meta.env.VITE_PROD_URL
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const query =
            `query {
                ${type}(pageNum: ${pageNum}, size: 10${usernameField}${sortField}) {
                    hasNext
                    posts {
                        id
                        text
                        imageURL
                        isEdited
                        author {
                            username
                            displayName
                            userColor
                            pictureURL
                        }
                        postDate(timezone: ${timezone})
                        score
                        ${userInfo.state.username ? "voteStatus" : ""}
                        ${userInfo.state.username ? "rechirpStatus" : ""}

                        ${selectedFeed !== Feed.Following ? "" :
                        `isRechirp
                        rootPost {
                            author {
                                username
                                displayName
                                userColor
                                pictureURL
                            }
                            id
                            text
                            imageURL
                            isEdited
                            
                            postDate(timezone: ${timezone})
                            score
                            ${userInfo.state.username ? "voteStatus" : ""}
                            ${userInfo.state.username ? "rechirpStatus" : ""}
                        }`
                        }
                    }
                }
            }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        }).then(res => res.json())
        console.log(response);

        setDoneFetching(true);

        const info: {hasNext: boolean, posts: PostPayload[]} = response.data[type];

        
        if (selectedFeed === Feed.Following) {
            if (!info) {
                setFollowingFeed([]);
                return;
            } else
                setFollowingOthers(true);
        }

        if (!info) {
           return;
        }

        const newChirps: JSX.Element[] = info.posts.map((post: PostPayload) => {
            let rechirper: Rechirper | undefined = undefined

            if (selectedFeed === Feed.Following && post.isRechirp) {
                if (post.rootPost == null) { //original post was deleted
                    return null;
                } else {
                    rechirper = {
                        username: post.author.username,
                        displayName: post.author.displayName,
                        userColor: post.author.userColor,
                        dateRechirped: post.postDate
                    }

                    post = post.rootPost;
                }
            }

            return <Chirp
                authorUsername={post.author.username}
                authorDisplayName={post.author.displayName}
                authorPictureURL={post.author.pictureURL}
                id={post.id}
                postDate={post.postDate}
                text={post.text}
                imageURL={post.imageURL}
                key={rechirper ? `${rechirper.username}_${post.id}` : post.id}
                score={post.score}
                voteStatus={userInfo.state.username ? post.voteStatus : 0}
                rechirpStatus={userInfo.state.username ? post.rechirpStatus : false}
                userColor={post.author.userColor}
                isEdited={post.isEdited}
                pinned={null} //only shows on profile

                rechirper={rechirper}
            />
        })
        .filter((chirp: JSX.Element | null) => chirp !== null) as JSX.Element[];

        if (selectedFeed === Feed.All) {
            if (reset) {
                setAllFeed(newChirps);
                setAllPageNum(1);
            } else {
                setAllFeed(allFeed.concat(newChirps));
                setAllPageNum(allPageNum + 1);
            }
            setAllHasNextPage(info.hasNext);
        } else if (selectedFeed === Feed.Trending) {
            if (reset) {
                setTrendingFeed(newChirps);
                setTrendingPageNum(1);
            } else {
                setTrendingFeed(trendingFeed.concat(newChirps));
                setTrendingPageNum(trendingPageNum + 1);
            }

            setTrendingHasNextPage(info.hasNext);
        } else if (selectedFeed === Feed.Following) {
            if (reset) {
                setFollowingFeed(newChirps);
                setFollowingPageNum(1);
            } else {
                setFollowingFeed(followingFeed.concat(newChirps));
                setFollowingPageNum(followingPageNum + 1);
            }

            setFollowingHasNextPage(info.hasNext);
        }
    }


    
    let emptyMsg = "";
    let feed: JSX.Element[] = [];
    switch (selectedFeed) {
        case Feed.All:
            feed = allFeed;
            emptyMsg = "No Chirps";

            break;
        case Feed.Trending:
            feed = trendingFeed;
            emptyMsg = "No Chirps in the Past 24 Hours";

            break;
        case Feed.Following:
            feed = followingFeed;

            if (followingOthers)
                emptyMsg = "No Chirps From Followed Users";
            else
                emptyMsg = "You Are Not Following Any Users";

            break;
        default:
            break;
    }


    useScrollBottom(async () => {
        await getChirps();
    })

    
    const [sortMethod, sortDirection, sortBubble] = useSort(doneFetching, getChirps, () => {
        setAllFeed([])
        setFollowingFeed([])

        setAllPageNum(0)
        setFollowingPageNum(0)

        setAllHasNextPage(true)
        setFollowingHasNextPage(true)
    })

    return (
        <div className="p-4 bg-black/20 min-h-screen shadow-2xl">
            {selectedFeed !== Feed.Trending ? sortBubble : null}
            
                <div className="grid grid-cols-3 mb-6">
                    <FeedButton
                        name={"Trending"}
                        onClick={() => switchFeeds(Feed.Trending)}
                        isActive={selectedFeed === Feed.Trending} />
                    <FeedButton
                        name={"All"}
                        onClick={() => switchFeeds(Feed.All)}
                        isActive={selectedFeed === Feed.All} />
                    <FeedButton
                        name={"Following"}
                        onClick={() => switchFeeds(Feed.Following)}
                        isActive={selectedFeed === Feed.Following} />
                </div>

                <ul className="mt-6 w-[95%] mx-auto">
                    {feed}

                    {!doneFetching ?
                        <>
                            <ChirpPlaceholder />
                            <ChirpPlaceholder />
                            <ChirpPlaceholder />
                            <ChirpPlaceholder />
                            <ChirpPlaceholder />
                            <ChirpPlaceholder />
                            <ChirpPlaceholder />
                            <ChirpPlaceholder />   
                        </>
                    : feed.length === 0 ?
                        <div className="text-center text-white text-lg my-4 whitespace-pre-line">
                            {emptyMsg}
                        </div> 
                    : null}
                </ul>
            </div>
    )
}

export default HomeFeed;