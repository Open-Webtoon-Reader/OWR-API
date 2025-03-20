import CachedWebtoonModel from "../../../modules/webtoon/webtoon/models/models/cached-webtoon.model";

export default class WebtoonQueue{
    elements: CachedWebtoonModel[];

    constructor(){
        this.elements = [];
    }

    enqueue(element: CachedWebtoonModel){
        this.elements.push(element);
    }

    dequeue(): CachedWebtoonModel | undefined{
        if(!this.isEmpty())
            return this.elements.shift();
    }

    peek(){
        if(!this.isEmpty())
            return this.elements[0];
    }

    length(){
        return this.elements.length;
    }

    isEmpty(){
        return this.length() === 0;
    }

    clear(){
        this.elements = [];
    }

    getElements(){
        return this.elements;
    }
}
