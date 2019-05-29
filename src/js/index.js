import Search from "./models/Search";
import Recipe from "./models/Recipe";
import List from "./models/List";
import Likes from "./models/Likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
import { elements, renderLoader, clearLoader } from "./views/base";


/* golbal state of the app
- search object
- current recipe object
- shopping list object
- linked recipes
*/
const state = {};

// SEARCH CONTROLLER
const controlSearch = async () => {
    // 1. get query from view
    const query = searchView.getInput();
    if (query) {
        // 2. search object and add it to state.
        state.search = new Search(query);
        // 3. prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        try {
        // 4. search for recipes 
        await state.search.getResults();
        
        // 5. render results on UI
        clearLoader();
        searchView.renderResults(state.search.result);
        } catch (err) {
            alert ("Somthing went wrong with the search...");
            console.log(err);
            clearLoader();
        }
       
    }
}

elements.searchForm.addEventListener("submit", e => {
    e.preventDefault();
    controlSearch();

})

elements.searchResPages.addEventListener("click", e => {
    const btn = e.target.closest(".btn-inline");
    if (btn){
        const goToPage = Number(btn.dataset.goto);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
})

// RECIPE CONTROLLER

const controlRecipe = async () => {
    // get UI for URL
    const id = window.location.hash.replace("#", "");
    console.log(id);

    if (id) {
        // prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);
        // Highlight selected search item
        if (state.search) {
            searchView.highLightSelected(id);
        } 
        // create new recipe object
        state.recipe = new Recipe (id);
        try {
            // get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            // calcule servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
            // Render recipe 
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
        } catch (err) {
            alert ("error procesing recipe");
            console.log(err)
        }
      
    }
}

["hashchange", "load"].forEach(event => window.addEventListener(event, controlRecipe));

// LIST CONTROLLER

const controlList = () => {
    // create a list if there is none
    if (!state.list) {
        return state.list = new List ();
    };

    // add new ingredient to the list amd UI
    state.recipe.ingredients.forEach(el => {
       const item = state.list.addItem(el.count, el.unit, el.ingredient);
       listView.renderItem(item);
    })
}

// handle delete update list events

elements.shopping.addEventListener("click", e => {
    const id = e.target.closest(".shopping__item").dataset.itemid;

    // handle delete button
    if (e.target.matches(".shopping__delete, .shopping__delete *")){
        // delete from state
        state.list.deleteItem(id);

        // delate from UI
        listView.deleteItem(id)
        //handle the count update
    } else if (e.target.matches(".shopping__count-value")) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
})

// LIKES CONTROLLER



const controlLike = () => {
    if (!state.likes) {
        state.likes = new Likes ();
    }
    const currentID = state.recipe.id;

    // user has not liked the recipe
    if (!state.likes.isLiked(currentID)){
        // add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img,
        );
        // toggle the like button
        likesView.toggleLikeBtn(true);
        // add like to the UI list
        likesView.renderLike(newLike)
        console.log(state.likes);

    // user has liked the current recipe
    } else {
        // remove like from the state
        state.likes.deleteLike(currentID);
        // toggle the like button
        likesView.toggleLikeBtn(false);
        // remove like from UI list
        likesView.deleteLike(currentID);
        console.log(state.likes);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
}

// Restore liked recipies on page load
window.addEventListener("load", () => {
    state.likes = new Likes();

    // restore likes
    state.likes.readStorage();

    // toggle likes meny button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // render likes
    state.likes.likes.forEach(like => {
        likesView.renderLike(like);
    })
})

// handling recipe button clicks

elements.recipe.addEventListener("click", e => {
    if (e.target.matches(".btn-decrease, .btn-decrease *")){
        // Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings("dec");
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches(".btn-increase, .btn-increase *")){
        // Increase button is clicked
        state.recipe.updateServings("inc");
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches(".recipe__btn--add, .recipe__btn--add *")) {
        // add ingredients to shopping list
        controlList();
    } else if (e.target.matches(".recipe__love, .recipe__love *")){
        //like controller
        controlLike();
    }
});

const l = new List();






window.l = l;
window.state = state;
