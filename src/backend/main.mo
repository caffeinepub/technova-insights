import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";



actor {
  type Article = {
    id : Nat;
    title : Text;
    content : Text;
    publishDate : Int;
  };

  let articles = Map.empty<Nat, Article>();
  var nextId = 0;

  var password = "Hanan741";

  public query({ caller }) func getArticles() : async [Article] {
    articles.values().toArray();
  };

  public shared({ caller }) func publishArticle(pass : Text, title : Text, content : Text) : async Text {
    assert (pass == password);
    let id = nextId;
    nextId += 1;
    let article : Article = {
      id = id;
      title = title;
      content = content;
      publishDate = Time.now();
    };
    articles.add(id, article);
    "Success";
  };

  public shared({ caller }) func changePassword(currentPassword : Text, newPassword : Text) : async Text {
    assert (currentPassword == password);
    assert (newPassword.size() >= 6);
    password := newPassword;
    "Success";
  };

  public shared({ caller }) func deleteArticle(id : Nat, pass : Text) : async Text {
    if (id >= nextId) {
      return "Success";
    };
    assert (pass == password);
    articles.remove(id);
    "Success";
  };
};
