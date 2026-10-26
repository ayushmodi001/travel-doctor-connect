import 'react-native';

declare module 'react-native' {
  interface FlatList<ItemT = any> {
    context: any;
    setState: any;
    forceUpdate: any;
    props: any;
    state: any;
  }
  interface KeyboardAvoidingView {
    context: any;
    setState: any;
    forceUpdate: any;
    props: any;
    state: any;
  }
  interface StatusBar {
    context: any;
    setState: any;
    forceUpdate: any;
    props: any;
    state: any;
  }
}
