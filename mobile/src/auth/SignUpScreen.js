import React, { Component } from "react";
import { connect } from "react-redux";
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Text, Button, Title } from "react-native-paper";
import MasterPassword from "../password/MasterPassword";
import TextInput from "../ui/TextInput";
import Styles from "../ui/Styles";
import { addError } from "../errors/errorsActions";
import { signUp } from "./authActions";
import { isEmpty } from "lodash";
import routes from "../routes";

export class SignUpScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
      isLoading: false,
    };
  }

  render() {
    const { email, password, isLoading } = this.state;
    const { navigation, settings, addError, signUp } = this.props;
    const { encryptMasterPassword } = settings;

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={Styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={Styles.innerContainer}>
            <Title style={Styles.title}>Create an account</Title>
            <TextInput
              mode="outlined"
              label="Email"
              value={email}
              onChangeText={(text) => this.setState({ email: text.trim() })}
            />
            <MasterPassword
              label={encryptMasterPassword ? "Master Password" : "Password"}
              masterPassword={password}
              hideFingerprint={!encryptMasterPassword}
              onChangeText={(password) => this.setState({ password })}
            />
            <Button
              compact
              icon="account-circle"
              mode="contained"
              style={Styles.loginSignInButton}
              disabled={isEmpty(email) || isEmpty(password) || isLoading}
              onPress={() => {
                this.setState({ isLoading: true });
                signUp(
                  {
                    email,
                    password,
                  },
                  encryptMasterPassword
                )
                  .then(() => navigation.navigate(routes.PASSWORD_GENERATOR))
                  .catch(() => {
                    this.setState({ isLoading: false });
                    addError(
                      "Unable to sign up. Try in a few minutes or contact an administrator."
                    );
                  });
              }}
            >
              Sign Up
            </Button>
            <Text>Already have an account?</Text>
            <Button
              compact
              icon="account-circle"
              mode="outlined"
              style={Styles.loginSignUpButton}
              onPress={() => navigation.navigate(routes.SIGN_IN)}
            >
              Sign In
            </Button>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  }
}

function mapStateToProps(state) {
  return {
    settings: state.settings,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    addError: (message) => dispatch(addError(message)),
    signUp: (credentials, encryptMasterPassword) =>
      dispatch(signUp(credentials, encryptMasterPassword)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SignUpScreen);
