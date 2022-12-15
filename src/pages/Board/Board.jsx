import axios from "axios";
import Header from "components/Header/Header";
import Form from "components/Form/Form";
import ListContainer from "./ListContainer";
import { useState, useEffect } from "react";
import styles from "./Board.module.css";
import { DragDropContext } from "@hello-pangea/dnd";

const Board = () => {
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: lists } = await axios.get(
        `https://api.trello.com/1/boards/luQhevFB/lists?key=${process.env.REACT_APP_KEY}&token=${process.env.REACT_APP_TOKEN}`
      );

      setLists(lists);

      const { data: cards } = await axios.get(
        `https://api.trello.com/1/boards/luQhevFB/cards?key=${process.env.REACT_APP_KEY}&token=${process.env.REACT_APP_TOKEN}`
      );

      if (cards) {
        setIsLoading(false);

        setCards(cards);
      }
    };

    fetchData();
  }, [cards.length]);

  const handleChange = (e) => setText(e.target.value);

  const createList = async (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    const { data } = await axios.post(
      `https://api.trello.com/1/boards/luQhevFB/lists?name=${text}&key=${process.env.REACT_APP_KEY}&token=${process.env.REACT_APP_TOKEN}`
    );

    setText("");
    setLists([data, ...lists]);
  };

  const onDragEnd = ({ source, destination, type }) => {
    if (
      !destination ||
      (source.index === destination.index &&
        source.droppableId === destination.droppableId)
    )
      return;

    if (type === "LIST") {
      let _lists = structuredClone(lists);
      const [list] = _lists.splice(source.index, 1);

      _lists.splice(destination.index, 0, list);

      _lists = _lists.map((_list, pos) => ({ ..._list, pos }));

      console.log(..._lists.map(({ name, pos }) => [name, pos]));

      _lists.forEach(({ id, pos }) => {
        axios
          .put(
            `https://api.trello.com/1/lists/${id}?key=${process.env.REACT_APP_KEY}&token=${process.env.REACT_APP_TOKEN}&pos=${pos}`
          )
          .then((res) => console.log(res.data.name, res.data.pos));
      });

      setLists(_lists);
    }

    if (type === "CARD") {
      const deepCopiedCards = structuredClone(cards);
      if (source.droppableId === destination.droppableId) {
        let _cards = deepCopiedCards.filter(
          (card) => card.idList === source.droppableId
        );
        const [card] = _cards.splice(source.index, 1);

        _cards.splice(destination.index, 0, card);

        _cards = _cards.map((_card, pos) => ({ ..._card, pos: pos + 1 }));

        console.log(..._cards.map(({ name, pos }) => [name, pos]));

        _cards.forEach(({ id, pos }) => {
          axios
            .put(
              `https://api.trello.com/1/cards/${id}?key=${process.env.REACT_APP_KEY}&token=${process.env.REACT_APP_TOKEN}&pos=${pos}`
            )
            .then((res) => console.log(res.data.name, res.data.pos));
        });

        setCards(_cards);
      } else {
        let _cardsFrom = deepCopiedCards.filter(
          (card) => card.idList === source.droppableId
        );
        let _cardsTo = deepCopiedCards.filter(
          (card) => card.idList === destination.droppableId
        );
        const [from] = _cardsFrom.splice(source.index, 1);

        console.log(from);

        _cardsFrom = _cardsFrom.map((_card, pos) => ({ ..._card, pos }));

        _cardsTo.splice(destination.index, 0, from);

        _cardsTo = _cardsTo.map((_card, pos) =>
          pos === destination.index
            ? { ..._card, pos, idList: destination.droppableId }
            : { ..._card, pos }
        );

        _cardsTo.forEach(({ id, pos }) => {
          pos === destination.index
            ? axios.put(
                `https://api.trello.com/1/cards/${id}?key=${process.env.REACT_APP_KEY}&token=${process.env.REACT_APP_TOKEN}&pos=${pos}&idList=${destination.droppableId}`
              )
            : axios.put(
                `https://api.trello.com/1/cards/${id}?key=${process.env.REACT_APP_KEY}&token=${process.env.REACT_APP_TOKEN}&pos=${pos}`
              );
        });

        setCards([..._cardsFrom, ..._cardsTo]);
      }
    }
  };

  return (
    <>
      <Header />
      <h2 className={styles.title}>My first board</h2>
      <Form
        placeholder={"Add a list"}
        value={text}
        onChange={handleChange}
        onSubmit={createList}
      />
      <DragDropContext onDragEnd={onDragEnd}>
        {isLoading ? null : (
          <ListContainer
            lists={lists}
            setLists={setLists}
            cards={cards}
            setCards={setCards}
          />
        )}
      </DragDropContext>
    </>
  );
};

export default Board;
